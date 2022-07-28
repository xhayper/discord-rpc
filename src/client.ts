import { User } from "./structures/user";

export interface ClientOptions {
    clientId: string;
}

export class Client {
    clientId: string = "";
    user?: User;
}