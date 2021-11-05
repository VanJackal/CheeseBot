const { EC2Client, StopInstancesCommand, StartInstancesCommand, DescribeInstanceStatusCommand } = require('@aws-sdk/client-ec2');
const client = new EC2Client({ region: "us-east-2" });
const mcPing = require('minecraft-ping');

const TIME = 1800000;//1.8Mms = 1800s = 30min

class Server {
    #serverTimeout;// Timeout storage//TODO move this to the serverside client 

    /**
     * initialize the server
     * @param {*} instanceID AWS instance id for the server
     * @param {*} serverURI URI of the game server
     * @param {*} serverPort port of the game server
     * @param {*} HRID Human Readable ID
     * @param {Boolean} doTimeout should the server do a timeout
     */
    constructor(instanceID, serverURI, serverPort, HRID, doTimeout) {
        this.instanceID = instanceID;
        this.serverURI = serverURI;
        this.serverPort = serverPort;
        this.HRID = HRID;
        this.doTimeout = doTimeout;
        this.#serverTimeout = null;

        this.recentStatus = "Initializing";//TODO remove status buffer
    }

    /**
     * stop the server
     * @returns command status message
     */
    stopServer = async () => {
        let online = await this.getInstanceStatus();
        if (!online) {
            return `${this.HRID} Already Offline`;
        }
        const command = new StopInstancesCommand({ InstanceIds: [this.instanceID] });
        const response = await client.send(command);
        this.endTimeout();
        this.recentStatus = "Offline/Shutting down";
        console.log(response);
        return `${this.HRID} shutting down`;
    }

    /**
     * start the server
     * @returns command status message
     */
    startServer = async () => {
        let online = await this.getInstanceStatus();
        if (online) {
            return `${this.HRID} Already Online`;
        }
        const command = new StartInstancesCommand({ InstanceIds: [this.instanceID] });
        const response = await client.send(command);
        this.recentStatus = "Online/Booting";
        console.log(response);
        return `${this.HRID} Booting`;
    }

    /**
     * get the current status and send it to a callback function
     * @param {*} cb 
     */
    getServerStatus = async (message, cb = this.processStatus) => {//if cb is given args (null,null) then the instance isnt up
        const instanceStatus = await this.getInstanceStatus();
        if (instanceStatus) {
            this.recentStatus = "Instance Online"
            mcPing.ping_fe({ host: this.serverURI, port: this.serverPort }, (err,res) => {
                cb(err,res);
                message?.channel.send(this.recentStatus);
            });
            return "";
        } else {
            this.recentStatus = "Instance Offline"
            cb(null, null);
            return this.recentStatus;
        }
    }

    /**
     * process the status and store it in status buffer
     * @param {*} err error
     * @param {*} res response
     */
    processStatus = (err, res) => {
        if (!err && res) {
            console.log(res);
            let players = res.playersOnline ?? 0;
            this.processTimeout(players);
        } else if (!res && err) {
            console.log("Error in Status Processing(Minecraft Server likely offline):")
            console.log(err)
            this.processTimeout(0);//treat it as if there are no players (so th e server will close if it has crashed)
            this.recentStatus = "Offline/Booting";
        } else {//Server and EC2 instance are offline
            this.endTimeout();
            this.recentStatus = "Offline";
        }
    }

    /**
     * reset timeout based on player count
     * @param {int} players 
     */
    processTimeout = (players) => {
        if (players > 0) {
            this.endTimeout();
            this.recentStatus = `Online (${players} players)`;
        } else if (players == 0 && !this.#serverTimeout) {
            if (this.doTimeout) {
                this.#serverTimeout = setTimeout(this.stopServer, TIME);
                this.recentStatus = "Online (Server timeout in 30min or less)";
            } else {
                this.recentStatus = `Online ${players} online (use "<prefix>stop ${this.HRID}" to stop the server)`
            }
        }
    }

    /**
     * remove current timeout
     */
    endTimeout = () => {
        if (this.#serverTimeout) {
            clearTimeout(this.#serverTimeout);
            this.#serverTimeout = null;
        }
    }

    /**
     * checks if the instance is online
     * @returns true if the instance is online
     */
    getInstanceStatus = async function () {
        const command = new DescribeInstanceStatusCommand({ InstanceIds: [this.instanceID] });
        const response = await client.send(command);
        console.log(response);
        var ret = false
        if (response.InstanceStatuses && response.InstanceStatuses.length != 0) {
            ret = true;
        }
        console.log(ret);
        return ret;
    }
}

module.exports = {
    Server
}