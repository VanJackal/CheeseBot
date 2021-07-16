const {EC2Client, StopInstancesCommand, StartInstancesCommand, DescribeInstanceStatusCommand} = require('@aws-sdk/client-ec2');
const client = new EC2Client({ region: "us-east-2" });
const mcPing = require('minecraft-ping');

const TIME = 1800000;//1.8Mms = 1800s = 30min

class Server{
    #serverTimeout;

    constructor(instanceID,serverURI,serverPort){
        this.instanceID = instanceID;
        this.serverURI = serverURI;
        this.serverPort = serverPort;
        this.#serverTimeout = null;
    }

    stopServer = async () => {
        const command = new StopInstancesCommand({InstanceIds: [this.instanceID]});
        const response = await client.send(command);
        console.log(response)
    }

    startServer = async function(){
        const command = new StartInstancesCommand({InstanceIds: [this.instanceID]});
        const response = await client.send(command);
        console.log(response);
    }

    getServerStatus = async function(cb = this.processStatus){//if cb is given args (null,null) then the instance isnt up
        const instanceStatus = await this.getInstanceStatus();
        if(instanceStatus){
            mcPing.ping_fe({host: this.serverURI, port: this.serverPort},cb);
        } else {
            cb(null,null);
        }
    }

    processStatus = (err,res) => {
        if(!err && res){
            console.log(res);
            let players = res.playersOnline ?? 0;
            this.processTimeout(players);
        } else if (!res && err){
            console.log("Error in Status Processing(Minecraft Server likely offline):")
            console.log(err)
            this.processTimeout(0);//treat it as if there are no players (so th e server will close if it has crashed)
        } else {//Server and EC2 instance are offline
            this.endTimeout();
        }
    }

    processTimeout = (players) => {
        if (players > 0){
            this.endTimeout();
        } else if (players == 0 && ! this.#serverTimeout) {
            this.#serverTimeout = setTimeout(this.stopServer,TIME);
        }
    }

    endTimeout = () => {
        if(this.#serverTimeout){
            clearTimeout(this.#serverTimeout);
            this.#serverTimeout = null;
        }
    }

    getInstanceStatus = async function(){
        const command = new DescribeInstanceStatusCommand({InstanceIds: [this.instanceID]});
        const response = await client.send(command);
        console.log(response);
        var ret = false
        if(response.InstanceStatuses && response.InstanceStatuses.length != 0){
            ret = true;
        }
        console.log(ret);
        return ret;
    }
}

module.exports = {
    Server
}