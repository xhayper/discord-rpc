import Payload from "discord-api-types/payloads/v10";
import { Client } from "../Client";
import { Base } from "./Base";
import { Message } from "./Message";

export class Channel extends Base {
    id: string;
    guild_id?: string;
    name: string;
    type: Payload.ChannelType;
    topic?: string;
    bitrate?: number;
    user_limit?: number;
    position?: number;
    voice_states?: Payload.GatewayVoiceState[];
    messages?: Message[];

    constructor(client: Client, props: any) {
        super(client);
        Object.assign(this, props);

        this.id = props.id;
        this.guild_id = props.guild_id;
        this.name = props.name;
        this.type = props.type;
        this.topic = props.topic;
        this.bitrate = props.bitrate;
        this.user_limit = props.user_limit;
        this.position = props.position;
        this.voice_states = props.voice_states;
        this.messages = props.messages?.map((messgeData: any) => new Message(client, messgeData));
    }
}
