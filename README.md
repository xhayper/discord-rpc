# discord-rpc

a fork of [discordjs/RPC](https://github.com/discordjs/RPC)

## Example

```ts
import { Client } from "@xhayper/discord-rpc";

const client = new Client({
    clientId: "123456789012345678"
});

client.on("ready", () => {
    client.user?.setActivity({
        state: "Hello, world!"
    });
});

client.login();
```

## TODO

-   Figure out how to test Websocket transport
-   Add more feature
-   Work on documentation
