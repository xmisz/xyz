import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, ChatInputCommandInteraction } from 'discord.js';

const command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong!と返信します'),
    async execute(interaction: ChatInputCommandInteraction) {
        // ここにコマンドの処理を記述します
        await interaction.reply('Pong!');
    },
};

export default command;