import Payload from "discord-api-types/payloads/v10";
import { Client } from "../Client";
import { Base } from "./Base";
import { User } from "./User";

export class Message extends Base {
    id: string;
    blocked: boolean;
    bot: boolean;
    content: string;
    content_parsed: any[];
    nick: number;
    author_color: string;
    edited_timestamp: string | null;
    timestamp: string;
    tts: boolean;
    mentions: User[];
    mention_everyone: boolean;
    mention_roles: string[];
    embeds: Payload.APIEmbed[];
    attachments: Payload.APIAttachment[];
    author: User;
    pinned: boolean;
    type: Payload.MessageType;

    constructor(client: Client, props: any) {
        super(client);
        Object.assign(this, props);

        this.id = props.id;
        this.blocked = props.blocked;
        this.bot = props.bot;
        this.content = props.content;
        this.content_parsed = props.content_parsed;
        this.nick = props.nick;
        this.author_color = props.author_color;
        this.edited_timestamp = props.edited_timestamp;
        this.timestamp = props.timestamp;
        this.tts = props.tts;
        this.mentions = props.mentions.map((mentionData: any) => new User(client, mentionData));
        this.mention_everyone = props.mention_everyone;
        this.mention_roles = props.mention_roles;
        this.embeds = props.embeds;
        this.attachments = props.attachments;
        this.author = new User(client, props.author);
        this.pinned = props.pinned;
        this.type = props.type;
    }
}
