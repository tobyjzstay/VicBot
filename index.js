const Discord = require(`discord.js`);
const fs = require(`fs`);
// const ytdl = require(`ytdl-core`);
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith(`.js`));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

const { prefix, token } = require(`./botConfig.json`);
const { forbiddenRanks, forbiddenChannels, aliasRanks, socialRanks } = require(`./config.json`);
var papersCategory;
var adminRole;

client.on(`ready`, () => {
	client.user.setUsername(`VicBot`);
	client.user.setActivity(`bugs, probably.`, { type: `PLAYING` });
	console.log(`Instance started at ${new Date()}\n`);
});

// actually log in
client.login(token);

// preventing some errors from killing the whole thing
process.on(`unhandledRejection`, error => console.error(`Uncaught Promise Rejection:\n${error}`));
process.on(`unhandledError`, error => console.error(`Unhandled Error:\n${error}`));
client.on(`disconnect`, error => console.error(`Disconnected!`));
client.on(`error`, console.error);

// listening for messages
client.on(`message`, async message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();

	adminRole = message.guild.roles.find(role => role.name === `Admins`);
	papersCategory = message.guild.channels.find(category => category.name === `papers`);

	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if(!command) return;

	if (command.admin && !message.member.roles.has(adminRole.id)) {
		return message.channel.send(`This requires admin permissions.`);
	}

	if(command.args && !args.length){
		let reply = `Please include the appropriate arguments, ${message.author}`;

		if(command.usage)
			reply += `\ne.g.: \`${command.usage}\``;

		return message.channel.send(reply);
	}
	
	try{
		command.execute(message, args);
	}
	catch(error){
		console.error(error);
		message.reply(`there was an error trying to execute that command!`);
	}
});


// /**
//  * Plays music based on a YouTube video, with queueing as appropiate.
//  * @param {Message} message
//  * @param {string[]} args
//  */
// async function play(message, args) {
//     if (message.channel.type !== `text`) return;

//     const { voiceChannel } = message.member;

//     if (!voiceChannel)
//         return message.reply(`Please join a voice channel first.`);

//     else if (!args.length)
//         return message.channel.send(`Please add a youtube link`);


//     else
//         voiceChannel.join().then(connection => {
//             const stream = ytdl(args[0], { filter: `audioonly` });
//             const dispatcher = connection.play(stream);
//             dispatcher.on(`end`, () => voiceChannel.leave());
//         })
//         ;
// }

// /**
//  * Pauses any music that is currently playing.
//  * @param {Message} message
//  * @param {string[]} args
//  */
// async function pause(message, args) {

// }

/**
 * Checks against permissions and forbidden roles, then adds the role to the user which sent the message.
 * @param {Message} message
 * @param {Role} rank
 */
exports.rank = async function(message, rank) {
	if (forbiddenRanks.includes(rank)) {
		return message.channel.send(`Sorry, you cannot join ${rank}.`);
	}

	else if (message.guild.roles.find(role => role.name === rank) == null) {
		return message.channel.send(`${rank} role doesn't exist. Consider asking an @admin to create it.`);
	}

	else if (!message.guild.roles.find(role => role.name === rank).members.has(message.author.id)) {
		await message.member.roles.add(message.guild.roles.find(role => role.name === rank));
		if(!aliasRanks.includes(rank)){
			const rankChannel = message.guild.channels.find(channel => channel.name === rank);
			return message.reply(`Added you to ${rankChannel} successfully.`);
		}
		else{
			return message.reply(`Added you to ${rank} successfully.`);
		}
	}

	else {
		await message.member.roles.remove(message.guild.roles.find(role => role.name === rank));
		if(!aliasRanks.includes(rank)){
			const rankChannel = message.guild.channels.find(channel => channel.name === rank);
			return message.reply(`Removed you from ${rankChannel} successfully.`);
		}
		else{
			return message.reply(`Removed you from ${rank} successfully.`);
		}
	}
}

/**
 * Sorts the channels within the 'papers' category.
 * TODO: Sort the roles as well.
 * @param {Message} message
 */
exports.organise = async function(message) {
	const channelArray = message.guild.channels.array();
	let paperLength = 0;
	const paperNameArray = [];

	channelArray.forEach(function(item) {
		if (item.parent != null)
			if (item.parent.name === `papers`) {
				paperLength++;
				paperNameArray.push(item.name);
			}

	});
	await paperNameArray.sort();

	for (let i = 0; i < paperLength; i++)
		if (message.guild.channels.find(channel => channel.name === paperNameArray[i]).position != i)
			await message.guild.channels.find(channel => channel.name === paperNameArray[i]).setPosition(i);

}

/**
 * Checks if three or more users have reacted with 📌, and pins the message.
 */
client.on(`messageReactionAdd`, async reaction => {
	if (!forbiddenChannels.includes(reaction.message.channel.name))
		if (reaction.emoji.name === `📌`) {
			if (reaction.count >= 3 && !reaction.message.pinned)
				await reaction.message.pin();

		}

});

/**
 * Creates a role and channel for the course specified
 *  - Restricts it to the role created and bots
 *  - Pulls the course title from the victoria website and sets the category
 *  - Places the channel within the 'papers' category
 *  - Sorts the 'papers' category to ensure the channel is in the correct alphabetical location.
 */

exports.newRank = async function(message, args) {
		await message.guild.roles.create({
			data: {
				name: args[0],
				hoist: false,
				mentionable: false,
			},
		});
		await message.guild.channels.create(args[0], {
			type: `text`,
			overwrites: [
				{
					id: message.guild.id,
					denied: [`VIEW_CHANNEL`],
				},
				{
					id: message.guild.roles.find(role => role.name === args[0]).id,
					allowed: [`VIEW_CHANNEL`],
				},
				{
					id: message.guild.roles.find(role => role.name === `bots`).id,
					allowed: [`VIEW_CHANNEL`],
				},
			],
			parent: papersCategory,
		});
		await this.organise(message);
	
		// pull the course title to be extra af
		const name = args[0].slice(0, 4) + args[0].slice(5, args[0].length);
		const title = ``;
		const currentYear = (new Date()).getFullYear();
		const https = require(`https`);
		https.get(`https://www.victoria.ac.nz/_service/courses/2.1/courses/${name}?year=${currentYear}`, (resp) => {
			let data = ``;
	
			// A chunk of data has been recieved.
			resp.on(`data`, (chunk) => {
				data += chunk;
			});
	
			// The whole response has been received. Print out the result.
			resp.on(`end`, () => {
				JSON.parse(data, function(key, value) {
					if (key === `title`)
						message.guild.channels.find(channel => channel.name === args[0]).setTopic(value);
	
				});
			});
	
		}).on(`error`, (err) => {
			console.log(`Error: ` + err.message);
		});
		console.log(title);
		return;
	}

/**
 * Deletes the channel and/or role specified.
 * @param {Message} message
 * @param {string[]} args
 */
exports.deleteRank = async function(message, args) {
	if (message.guild.roles.find(role => role.name === args[0]) != null) await message.guild.roles.find(role => role.name === args[0]).delete();
	if (message.guild.channels.find(channel => channel.name === args[0]) != null) await message.guild.channels.find(channel => channel.name === args[0]).delete();
	return;
}



