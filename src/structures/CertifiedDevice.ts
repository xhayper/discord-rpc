import { Client } from "../Client";
import { Base } from "./Base";

export enum DeviceType {
    AUDIO_INPUT = "audioinput",
    AUDIO_OUTPUT = "audiooutput",
    VIDEO_INPUT = "videoinput"
}

export interface Vendor {
    name: string;
    url: string;
}

export interface Model {
    name: string;
    url: string;
}

export class CertifiedDevice extends Base {
    type: DeviceType;
    id: string;
    vendor: Vendor;
    model: Model;
    related: string[];
    echo_cancellation?: boolean;
    noise_suppression?: boolean;
    automatic_gain_control?: boolean;
    hardware_mute?: boolean;

    constructor(client: Client, props: any) {
        super(client);
        Object.assign(this, props);

        this.type = props.type;
        this.id = props.id;
        this.vendor = props.vendor;
        this.model = props.model;
        this.related = props.related;
    }
}
