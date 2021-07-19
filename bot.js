require('dotenv').config();
const Discord = require("discord.js");
const client = new Discord.Client();

const {ServerManager} = require("./serverManager");
const serverManager = new ServerManager("./servers.json");
const config = require("./config.json");
const PREFIX = config.prefix;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    if(!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

    switch(command){
        case 'uwu':
            message.channel.send(':3');
            break;            
        case 'status':
            commandStatus(message,args[0]);
            break;
        case 'stop':
            commandStopInstance(message,args[0]);
            break;
        case 'start':
            commandStartInstance(message,args[0]);
            break;
        default:
            message.channel.send(`\`${command}\` is not a recognized command.`)
    }
});

async function commandStatus(message,HRID){
    status = serverManager.getStatusFromHRID(HRID);
    message.channel.send(status);
}

async function commandStartInstance(message,HRID){
    if(checkForPerms(message.author)){
        startMessage = await serverManager.startInstanceFromHRID(HRID);
        message.channel.send(startMessage);
    } else {
        message.channel.send("You do not have permission to do this");
    }
}

async function commandStopInstance(message,HRID){
    if(checkForPerms(message.author)){
        stopMessage = await serverManager.stopInstanceFromHRID(HRID);
        message.channel.send(stopMessage);
    } else {
        message.channel.send("You do not have permission to do this");
    }
}

function checkForPerms(author){
    let ret = false; 
    config.roles.forEach(roleID => {
        console.log(roleID);
        if(author.roles.cache.has(roleID)){
            ret = true;
            return;
        }
    });
    if(!ret && config.admins.includes(author.id)){            
        ret = true;
    }

    return ret;
}

client.login(process.env.TOKEN);