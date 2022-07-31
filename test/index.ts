const { Client } = require("@xhayper/discord-rpc");

const client = new Client({
    clientId: "964574770807058472"
});

client.on("ready", () => {
    client.user?.setActivity({
        state: "Suffering with my life",
        details: "Pain and Suffering",
        startTimestamp: new Date(),
        buttons: [
            { label: "Twitter", url: "https://twitter.com/hayper1919" },
            { label: "Github", url: "https://github.com/xhayper" }
        ],
        largeImageKey: "main",
        largeImageText: "me irl"
    });
});

client.login();
