import { Client } from "../src/index";

const client = new Client({
    clientId: "964574770807058472"
});

client.on("ready", async () => {
    await client.user?.setActivity({
        state: "Hello, world!",
        buttons: [
            {
                label: "Link Test",
                url: "https://github.com/xhayper/discord-rpc"
            },
            {
                label: "Protocol Test",
                url: `discord://-/users/${client.user!.id}`
            }
        ],
        startTimestamp: new Date()
    });
});

client.login();
