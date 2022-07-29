import { Client } from "../src/index";

(async () => {
    const client = new Client({
        clientId: "964574770807058472",
        transport: { type: "websocket" }
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

    client.login({ scopes: ["rpc"] });
})();
