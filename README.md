<!-- markdownlint-disable -->
<div align="center">
    <br />
    <h2>discord-rpc</h2>
    <br />
    <p>
        <a hrf="https://www.npmjs.com/package/@xhayper/discord-rpc" target="_blank"
            ><img src="https://img.shields.io/github/package-json/v/xhayper/discord-rpc/main" alt="Version"
        /></a>
        <a hrf="https://discord.com/invite/xTAR8nUs2g" target="_blank"
            ><img src="https://img.shields.io/discord/965168309731487805" alt="Discord"
        /></a>
        <a href="https://github.com/xhayper/discord-rpc/blob/main/LICENSE" target="_blank"
            ><img src="https://img.shields.io/github/license/xhayper/discord-rpc" alt="License"
        /></a>
    </p>
</div>
<!-- markdownlint-enable -->

## About

`discord-rpc` is a fork of [discordjs/RPC](https://github.com/discordjs/RPC)

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
