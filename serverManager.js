const {Server} = require("./server");
const refreshInterval = 300000;//300kms = 300s = 5min

/**
 * checks if the hrid is valid based on a response from AWS
 * 
 * @param {*} a return from a AWS request
 * @param {String} HRID 
 * @returns the 'a' or an error response
 */
let checkValid = (a,HRID) => {//checks if the hrid is valid based on a response from AWS
    return a ?? `Server with id \`${HRID}\` cannot be found.`
}

class ServerManager {
    #servers;// current list of Server objects
    #serverStatusRefresh;

    /**
     * @param {String} serversPath path of the json containing the servers handled by this ServerManager
     */
    constructor(serversPath){
        const serversJson = require(serversPath);
        this.#servers = [];
        serversJson.servers.forEach(server => {// initialize server array
            this.#servers.push(new Server(server.AWSID,server.URI,server.Port,server.HRID,server.timeout));
        });
        console.log(this.#servers);
        this.#serverStatusRefresh = setInterval(this.refreshStatuses,refreshInterval);//TODO Remove (recent status functionality)//refresh status every refreshInterval
    }

    /**
     * refresh the status buffers of each server object
     */
    refreshStatuses = () => {//TODO Remove Status Buffer
        this.#servers.forEach(server => {
            server.getServerStatus();
        });
    }

    /**
     * get the index of the server in the array of Servers from an hrid
     * @param {String} HRID 
     * @returns {int} index of the server with the hrid in the #servers array
     */
    serverIdxFromHRID = (HRID) => {
        for(let i = 0;i < this.#servers.length;i++){//TODO convert this to filter/find
            if(HRID && this.#servers[i].HRID.toLowerCase() === HRID.toLowerCase()){
                return i;
            }
        }
        return -1;
    }

    /**
     * Get Server object from an HRID
     * 
     * @param {String} HRID 
     * @returns {Server} server object with the given HRID
     */
    getServerFromHRID = (HRID) => {
        return this.#servers[this.serverIdxFromHRID(HRID)];//TODO Remove serverIdxFromHRID and replace with one find/filter statement
    }

    /**
     * get the status of the server from its hrid
     * @param {String} HRID 
     * @returns String describing status of the server with HRID
     */
    getStatusFromHRID = (HRID) => {
        let server = this.getServerFromHRID(HRID);
        this.refreshStatuses();//TODO Remove Status Buffer
        return server?.recentStatus ?? `Server with id \`${HRID}\` cannot be found.`;
    }

    /**
     * Start the server with the HRID
     * @param {String} HRID 
     * @returns response message
     */
    startInstanceFromHRID = async (HRID) => {
        let server = this.getServerFromHRID(HRID);
        let start = await server?.startServer();
        return checkValid(start,HRID);
    }

    /**
     * Stop server with the HRID
     * @param {String} HRID 
     * @returns response message
     */
    stopInstanceFromHRID = async (HRID) => {
        let server = this.getServerFromHRID(HRID);
        let stop = await server?.stopServer();
        return checkValid(stop,HRID);
    }
}

module.exports = {
    ServerManager
}