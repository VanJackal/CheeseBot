const {EC2Client, StopInstancesCommand, StartInstancesCommand} = require('@aws-sdk/client-ec2');
const client = new EC2Client({ region: "us-east-2" });
const mcPing = require('minecraft-ping');

class Server{
    #serverTimeout;

    constructor(instanceID,serverURI,serverPort){
        this.instanceID = instanceID;
        this.serverURI = serverURI;
        this.serverPort = serverPort;
        this.#serverTimeout = null;
    }

    stopServer = async function(){
        const command = new StopInstancesCommand({InstanceIds: [this.instanceID]});
        const response = await client.send(command);
        console.log(response)
    }

    startServer = async function(){
        const command = new StartInstancesCommand({InstanceIds: [this.instanceID]});
        const response = await client.send(command);
        console.log(response);
    }

    getServerStatus = function(cb = this.processStatus){//if cb is given args (null,null) then the instance isnt up
        if(this.getInstanceStatus){
            mcPing.ping_fe({host: this.serverURI, port: this.serverPort},cb);
        } else {
            cb(null,null);
        }
    }

    processStatus = function(err,res){
        if(!err && res){
            console.log(res);
        } else if (!res && err){
            console.log("Error in Status Processing:")
            console.log(err)
        } else {
            this.endTimeout();
        }
    }

    endTimeout = function(){
        if(this.#serverTimeout){
            clearTimeout(this.#serverTimeout);
            this.#serverTimeout = null;
        }
    }

    getInstanceStatus = function(){
        return true;
    }
}

module.exports = {
    Server
}