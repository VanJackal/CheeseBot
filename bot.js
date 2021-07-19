require('dotenv').config();
const Discord = require("discord.js");
const client = new Discord.Client();
const PREFIX = process.env.PREFIX;

const {ServerManager} = require("./serverManager");
const serverManager = new ServerManager("./servers.json");

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
        default:
            message.channel.send(`\`${command}\` is not a recognized command.`)
    }
});

function commandStatus(message,HRID){
    status = serverManager.getStatusFromHRID(HRID);
    message.channel.send(status);
}

client.login(process.env.TOKEN);