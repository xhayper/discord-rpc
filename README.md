<!-- markdownlint-disable -->
<div align="center">
    <br />
    <h3>discord-rpc</h3>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@xhayper/discord-rpc" target="_blank"><img src="https://img.shields.io/npm/v/@xhayper/discord-rpc.svg" alt="npm version"/></a>
        <a href="https://discord.com/invite/xTAR8nUs2g" target="_blank"><img src="https://img.shields.io/discord/965168309731487805.svg" alt="discord"/></a>
        <a href="https://github.com/xhayper/discord-rpc/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/xhayper/discord-rpc.svg" alt="license"/></a>
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

| TODO                                       | Status | Note                     |
| ------------------------------------------ | ------ | ------------------------ |
| Figure out how to test WebSocket transport | ❌     | Any help is appericated! |
| Add more feature                           | 🛠      |                          |
| Clean up the code                          | 🛠      |                          |
