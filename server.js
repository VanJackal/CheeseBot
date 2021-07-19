const {EC2Client, StopInstancesCommand, StartInstancesCommand, DescribeInstanceStatusCommand} = require('@aws-sdk/client-ec2');
const client = new EC2Client({ region: "us-east-2" });
const mcPing = require('minecraft-ping');

const TIME = 1800000;//1.8Mms = 1800s = 30min

class Server{
    #serverTimeout;

    constructor(instanceID,serverURI,serverPort,HRID){
        this.instanceID = instanceID;
        this.serverURI = serverURI;
        this.serverPort = serverPort;
        this.HRID = HRID;
        this.#serverTimeout = null;

        this.recentStatus = "Initializing";
    }

    stopServer = async () => {
        let online = await this.getInstanceStatus();
        if(!online){
            return `${this.HRID} Already Offline`;
        }
        const command = new StopInstancesCommand({InstanceIds: [this.instanceID]});
        const response = await client.send(command);
        this.endTimeout();
        this.recentStatus = "Offline/Shutting down";
        console.log(response);
        return `${this.HRID} shutting down`;
    }

    startServer = async () => {
        let online = await this.getInstanceStatus();
        if(online){
            return `${this.HRID} Already Online`;
        }
        const command = new StartInstancesCommand({InstanceIds: [this.instanceID]});
        const response = await client.send(command);
        this.recentStatus = "Online/Booting";
        console.log(response);
        return `${this.HRID} Booting`;
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
            this.recentStatus = "Offline/Booting";
        } else {//Server and EC2 instance are offline
            this.endTimeout();
            this.recentStatus = "Offline";
        }
    }

    processTimeout = (players) => {
        if (players > 0){
            this.endTimeout();
            this.recentStatus = `Online (${players} players)`;
        } else if (players == 0 && ! this.#serverTimeout) {
            this.#serverTimeout = setTimeout(this.stopServer,TIME);
            this.recentStatus = "Online (Server timeout in 30min or less)";
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