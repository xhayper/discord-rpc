import { Client } from "../src/index";

const client = new Client({
    clientId: "964574770807058472",
    debug: true
});

client.on("ready", async () => {
    await client.user?.setActivity({
        state: "Suffering with my life",
        details: "Pain and Suffering",
        startTimestamp: Date.now(),
        buttons: [
            { label: "Twitter", url: "https://twitter.com/hayper1919" },
            { label: "Github", url: "https://github.com/xhayper" }
        ],
        largeImageKey: "main",
        largeImageText: "me irl"
    });

    await client.user?.getRelationships();
});

client.login();
