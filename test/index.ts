import { Client } from "../src/index";
import { ActivityType } from "../src/structures/clientUser";

(async () => {
    const client = new Client({clientId: "964574770807058472"});

    client.on("ready", () => {
        console.log(client.user, client.user?.tag);

        client.user?.setActivity({
            state: "Hello, world!",
            buttons: [
                {
                    "label": "Hi!",
                    "url": "https://github.com/xhayper"
                }
            ]
        })
    });

    client.login();
})();