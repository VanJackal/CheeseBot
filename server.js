const {EC2Client, StopInstancesCommand, StartInstancesCommand, ModifyVolumeAttributeCommand} = require('@aws-sdk/client-ec2');
const client = new EC2Client({ region: "us-east-2" });

class ServerManager{
    constructor(instanceID,serverURI){
        this.instanceID = instanceID;
        this.serverURI = serverURI;
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
}

module.exports = {
    ServerManager
}