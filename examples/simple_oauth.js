const { Client } = require("@xhayper/discord-rpc");

const client = new Client({
    clientId: "123456789012345678",
    clientSecret: "YOUR_CLIENT_SECRET"
});

client.on("ready", async () => {
    await client.user?.setActivity({
        state: "Suffering with my life",
        details: "Pain and Suffering",
        startTimestamp: Date.now(),
        largeImageKey: "main",
        largeImageText: "me irl"
    });
});

client.login({ scopes: ["rpc", "guilds", "messages.read"] });
