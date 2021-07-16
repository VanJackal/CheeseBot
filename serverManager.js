const {Server} = require("./server");
const refreshInterval = 300000;//300kms = 300s = 5min

class ServerManager {
    #servers;
    #serverStatusRefresh;
    constructor(serversPath){
        const serversJson = require(serversPath);
        this.#servers = [];
        serversJson.servers.forEach(server => {
            this.#servers.push(new Server(server.AWSID,server.URI,server.Port))
        });
        console.log(this.#servers);
        this.#serverStatusRefresh = setInterval(this.refreshStatuses,refreshInterval);
    }

    refreshStatuses = () => {
        this.#servers.forEach(server => {
            server.getServerStatus();
        });
    }
}

module.exports = {
    ServerManager
}