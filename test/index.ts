import { Client } from "../src/index";

const client = new Client({
    clientId: "964574770807058472"
});

client.on("ready", () => {
    client.user?.setActivity({
        state: "Hello, world!",
        buttons: [
            {
                label: "Hi!",
                url: "https://github.com/xhayper"
            }
        ],
        startTimestamp: new Date()
    });
});

client.login();
