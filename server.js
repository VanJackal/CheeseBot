const {EC2Client, StopInstancesCommand, StartInstancesCommand, ModifyVolumeAttributeCommand} = require('@aws-sdk/client-ec2');
const client = new EC2Client({ region: "us-east-2" });

async function startServer(instanceID){
    const command = new StartInstancesCommand({InstanceIds: [instanceID]});
    const response = await client.send(command);
    console.log(response);
}

async function stopServer(instanceID){
    const command = new StopInstancesCommand({InstanceIds: [instanceID]});
    const response = await client.send(command);
    console.log(response)
}

module.exports = {
    startServer,
    stopServer
}