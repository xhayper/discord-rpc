import { Client } from "../src/index";

const client = new Client({
    clientId: "964574770807058472",
    debug: true
});

client.on("ready", async () => {
    await client.user?.setActivity({
        state: "Suffering with my life",
        details: "Pain and Suffering",
        startTimestamp: 100000,
        buttons: [
            { label: "Twitter", url: "https://twitter.com/hayper1919" },
            { label: "Github", url: "https://github.com/xhayper" }
        ],
        largeImageKey: "main",
        largeImageText: "me irl"
    });

    await client.user?.getRelationships();
    await client.subscribe("RELATIONSHIP_UPDATE");

    console.log(await client.user?.clearActivity());
});

client.login();
