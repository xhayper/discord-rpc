const { Client } = require("@xhayper/discord-rpc");

const client = new Client({
    clientId: "123456789012345678"
});

client.on("ready", async () => {
    await client.user?.setActivity({
        state: "Suffering with my life",
        details: "Pain and Suffering",
        startTimestamp: Date.now(),
        largeImageKey: "main",
        largeImageKeyAspectRatio: 16 / 9,
        largeImageText: "me irl",
        smallImageKey: "ptb",
        smallImageKeyAspectRatio: 1 / 1,
        smallImageText: "Discord PTB"
    });
});

client.login();
