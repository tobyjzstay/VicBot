module.exports = {
	name: `micropad`,
	args: false,
	usage: `\`!micropad\``,
	description: `Provides information about micropad.`,
	async execute(message, args){
		message.channel.send(`<:micropad:339927818181935105> is the easy to use powerful notepad app developed by our very own Nick. Check it out at https://getmicropad.com`);
	},
};