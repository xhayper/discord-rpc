import { REST, RESTOptions } from "@discordjs/rest";
import EventEmitter from "node:events";

export type ClientOptions = {
    rest: Partial<RESTOptions>;
};

export class BaseClient extends EventEmitter {
    public rest: REST;

    public constructor(options: ClientOptions) {
        super({ captureRejections: true });

        if (options.rest) options.rest = {};
        if (!options.rest.authPrefix) options.rest.authPrefix = "Bearer";

        this.rest = new REST(options.rest);
    }

    public destroy() {
        this.rest.requestManager.clearHashSweeper();
        this.rest.requestManager.clearHandlerSweeper();
    }
}
