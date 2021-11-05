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

client.on('message', message => {//process commands
    if(!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

    switch(command){
        case 'uwu'://test text command
            message.channel.send(':3');
            break;            
        case 'status'://gets the status of the server with the given id
            commandStatus(message,args[0]);
            break;
        case 'stop'://stops the server with the given id
            commandStopInstance(message,args[0]);
            break;
        case 'start'://start the server with given id
            commandStartInstance(message,args[0]);
            break;
        default:
            message.channel.send(`\`${command}\` is not a recognized command.`)
    }
});

/**
 * get the status of a server from its hrid
 * @param {Message} message 
 * @param {String} HRID 
 */
async function commandStatus(message,HRID){
    let status = await serverManager.getStatusFromHRID(message,HRID);
    if (status) message.channel.send(status);
}

/**
 * start a server from its hrid
 * @param {Message} message 
 * @param {String} HRID 
 */
async function commandStartInstance(message,HRID){
    if(checkForPerms(message.member)){//move the check for perms func to function with a callback
        startMessage = await serverManager.startInstanceFromHRID(HRID);
        message.channel.send(startMessage);
    } else {
        message.channel.send("You do not have permission to do this");
    }
}

/**
 * stop a server from its hrid
 * @param {Message} message 
 * @param {String} HRID 
 */
async function commandStopInstance(message,HRID){
    console.log(message.member.roles)
    if(checkForPerms(message.member)){
        stopMessage = await serverManager.stopInstanceFromHRID(HRID);
        message.channel.send(stopMessage);
    } else {
        message.channel.send("You do not have permission to do this");
    }
}

/**
 * check that the 'author' is an admin or has a controller role
 * @param {GuildMember} author 
 * @returns {Boolean} true if the author has permission to do this
 */
function checkForPerms(author){
    let ret = false; 
    config.roles.forEach(roleID => {//check if user has role
        if(author.roles.cache.has(roleID)){
            ret = true;
            return;
        }
    });
    if(!ret && config.admins.includes(author.id)){// check if the user is a bot admin
        ret = true;
    }

    return ret;
}

client.login(process.env.TOKEN);