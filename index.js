const fs = require('node:fs');
const path = require('node:path');
const express = require('express'); // <== You need this
const http = require('http');       // <== And this
const WebSocket = require('ws');    // <== And this

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const logger = require('./winstonLogging');
const { bot: botConfig } = require('./config.json');

const token = botConfig.bot_token;

// intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Added logging to check if commands are loaded
logger.info('Loading commands...');
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            logger.info(`Loaded command ${command.data.name} from ${filePath}`);
        } else {
            logger.info(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// Added logging to check if events are loaded
logger.info('Loading events...');
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
        logger.info(`Loaded one-time event ${event.name} from ${filePath}`);
    } else {
        client.on(event.name, (...args) => event.execute(...args));
        logger.info(`Loaded event ${event.name} from ${filePath}`);
    }
}

client.on('error', (error) => {
    logger.error('Discord API error:', error);
});

client.on('warn', logger.warn);
client.login(token).catch(logger.error);


// --- Express + WebSocket Server Setup ---
const app = express();
const server = http.createServer(app); // one HTTP server
const wss = new WebSocket.Server({ server }); // bind ws to it
const PORT = 25599;

// Broadcast "HELLO WORLD" every 10 seconds
setInterval(() => {
    // TODO: get the real code(s) from the bot here
    const message = 'HELLO2025';
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}, 5000);

wss.on('connection', ws => {
    console.log('WebSocket client connected');
});

// Start the combined HTTP + WebSocket server
server.listen(PORT, () => {
    console.log(`Server and WebSocket running at http://localhost:${PORT}`);
});
