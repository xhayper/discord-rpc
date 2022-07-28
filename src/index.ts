export { Client } from "./client";

import { Client } from "./client";
import { IPCTransport } from "./transport/ipc";

(async() => {
    const client = new Client();

    client.clientId = "964574770807058472"

    const transport = new IPCTransport(client);
    
    transport.on("message", console.log);

    await transport.connect();
})();