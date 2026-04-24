 import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits, ActivityType, CommandInteraction, TextChannel, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

// 環境変数の型安全な取得関数
function getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name}が見つかりませんでした。`);
    }
    return value;
}

// 定数の定義
const token = getRequiredEnvVar('DISCORD_TOKEN');
const TABLE_NAME = getRequiredEnvVar('SUPABASE_TABLE_NAME');
const CONSOLE_CHANNEL_ID = getRequiredEnvVar('CONSOLE_CHANNEL_ID');

// コマンドインターフェース
interface Command {
    data: {
        name: string;
        description: string;
    };
    execute: (interaction: CommandInteraction) => Promise<void>;
}

// クライアントの初期化
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

// コマンドを保持するMap
const commands: Map<string, Command> = new Map();
client.once(Events.ClientReady, async (c: Client) => {
    if (client.user) {
        client.user.setActivity("ここにBotのstateをかける", { type: ActivityType.Playing });
    }
    console.log(`準備OKです! ${c.user?.tag}がログインしました。`);
});

// コマンド読み込み
async function loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => 
        file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.cjs')
    );

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = await import(filePath);
            
            if (command.default?.data?.name) {
                console.log(`${command.default.data.name}を登録します。`);
                commands.set(command.default.data.name, command.default);
            }
        } catch (error) {
            console.error(`コマンド読み込み中にエラーが発生しました (${file}):`, error);
        }
    }
}

// コマンド読み込みの実行
loadCommands();

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
        console.error(`${interaction.commandName}というコマンドには対応していません。`);
        return;
    }

    try {
        await command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
        console.error('コマンド実行中にエラーが発生しました:', error);
        const response = { 
            content: 'コマンド実行時にエラーが発生しました。', 
            ephemeral: true 
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
});

client.login(token).catch(error => {
    console.error('ログインに失敗しました:', error);
    process.exit(1);
});   