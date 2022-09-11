import { BaseClient, ClientOptions } from "./BaseClient";
import { ClientUser } from "../structures/ClientUser";
import { UserManager } from "../managers/UserManager";

export class Client extends BaseClient {
    public token: string = "";
    public user?: ClientUser;

    public presence: any = null;

    public users: UserManager;

    constructor(options: ClientOptions) {
        super(options);

        this.users = new UserManager(this);
    }
}