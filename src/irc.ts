import { ChatClient } from "@kararty/dank-twitch-irc";
import { config } from "./lib/config.js";

export const client = new ChatClient();

client.on("close", (err) => {
    console.log(err);
});

client.on("JOIN", (message) => {
    console.log("irc joined", message.channelName);
});

client.join(config.irc.channel);

export async function initIRC() {
    client.connect();
    await new Promise<void>((res) => {
        client.on("ready", () => {
            console.log("connnect to IRC");
            res();
        });
    });
}
