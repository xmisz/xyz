import { REST, Routes, SlashCommandBuilder, CommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";
dotenv.config();

// 環境変数としてapplicationId, guildId, tokenの3つが必要です
const {
    CLIENT_ID: applicationId,
    DISCORD_TOKEN: token,
    GUILD_ID : guildId,
    NODE_ENV
  } = process.env as { [key: string]: string };
  
  // 環境変数が足りない場合のエラーチェック
  if (!applicationId || !token ) {
    throw new Error("Missing environment variables: CLIENT_ID, GUILD_ID, or DISCORD_TOKEN");
  }

// Commandインターフェースの定義
interface Command {
    data: SlashCommandBuilder; // コマンドデータを格納
    execute: (interaction: CommandInteraction) => Promise<void>; // コマンドの実行関数
}

// commands配列はRESTPostAPIChatInputApplicationCommandsJSONBody型の配列
const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

// 非同期関数を使用
const registerCommands = async (): Promise<void> => {
    // commandsフォルダ内の全てのコマンドファイルを読み込む
    const commandsPath = path.join(__dirname, 'commands');
    if (!fs.existsSync(commandsPath)) {
        throw new Error(`Commands directory not found: ${commandsPath}`);
    }
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.cjs'));

        for (const file of commandFiles) {
            const commandModule = await import(commandsPath + '/' + file);

            // デフォルトエクスポートされたコマンドを取得
            const command: Command = commandModule.default;
            commands.push(command.data.toJSON() as RESTPostAPIChatInputApplicationCommandsJSONBody); // コマンドをJSON形式で追加
        }

    const rest = new REST({ version: '10' }).setToken(token);

    // Discordサーバーにコマンドを登録
    try {
        await rest.put(
            Routes.applicationGuildCommands(applicationId, guildId),
            { body: commands },
        );
        console.log('サーバー固有のコマンドが登録されました！');
    } catch (error) {
        console.error('コマンドの登録中にエラーが発生しました:', error);
    }
};

registerCommands();    