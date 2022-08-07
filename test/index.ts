import { Client } from "../src/index";

const client = new Client({
    clientId: "964574770807058472",
    clientSecret: "G4DNVEHxFI5iJEmoKxXvgdRY66M0AttQ",
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
});

client.login({ scopes: ["guilds"], prompt: "consent" });
