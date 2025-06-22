import { Client } from "@xhayper/discord-rpc";

// You will need to add a dummy url to the "Redirects" section of your Discord OAuth2 application.
// clientSecret is REQUIRED for this to work.

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
        largeImageKeyAspectRatio: 16 / 9,
        largeImageText: "me irl",
        smallImageKey: "ptb",
        smallImageKeyAspectRatio: 1 / 1,
        smallImageText: "Discord PTB"
    });
});

client.login({
    scopes: [
        // These are all the allowed scopes
        "connections",
        "email",
        "gdm.join",
        "guilds",
        "guilds.join",
        "guilds.members.read",
        "identify",
        "messages.read"
    ],
    prompt: "none" // Only prompt once
});
