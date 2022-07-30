import { Client } from "../src/index";

const client = new Client({
    clientId: "964574770807058472"
});

client.on("ready", async () => {
    await client.user?.setActivity({
        state: "Hello, world!",
        buttons: [
            {
                label: "Hi!",
                url: "https://github.com/xhayper/discord-rpc"
            }
        ],
        startTimestamp: new Date()
    });

    console.log(await client.user?.getRelationships());
});

client.login();
