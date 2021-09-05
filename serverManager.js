const {Server} = require("./server");
const refreshInterval = 300000;//300kms = 300s = 5min

let checkValid = (a,HRID) => {
    return a ?? `Server with id \`${HRID}\` cannot be found.`
}

class ServerManager {
    #servers;
    #serverStatusRefresh;
    constructor(serversPath){
        const serversJson = require(serversPath);
        this.#servers = [];
        serversJson.servers.forEach(server => {
            this.#servers.push(new Server(server.AWSID,server.URI,server.Port,server.HRID,server.timeout));
        });
        console.log(this.#servers);
        this.#serverStatusRefresh = setInterval(this.refreshStatuses,refreshInterval);
    }

    refreshStatuses = () => {
        this.#servers.forEach(server => {
            server.getServerStatus();
        });
    }

    serverIdxFromHRID = (HRID) => {
        for(let i = 0;i < this.#servers.length;i++){
            if(HRID && this.#servers[i].HRID.toLowerCase() === HRID.toLowerCase()){
                return i;
            }
        }
        return -1;
    }

    getServerFromHRID = (HRID) => {
        return this.#servers[this.serverIdxFromHRID(HRID)];
    }

    getStatusFromHRID = (HRID) => {
        let server = this.getServerFromHRID(HRID);
        this.refreshStatuses();
        return server?.recentStatus ?? `Server with id \`${HRID}\` cannot be found.`;
    }

    startInstanceFromHRID = async (HRID) => {
        let server = this.getServerFromHRID(HRID);
        let start = await server?.startServer();
        return checkValid(start,HRID);
    }

    stopInstanceFromHRID = async (HRID) => {
        let server = this.getServerFromHRID(HRID);
        let stop = await server?.stopServer();
        return checkValid(stop,HRID);
    }
}

module.exports = {
    ServerManager
}