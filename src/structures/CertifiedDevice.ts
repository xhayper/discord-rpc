import type { Client } from "../Client";
import { Base } from "./Base";

export enum DeviceType {
    AUDIO_INPUT = "audioinput",
    AUDIO_OUTPUT = "audiooutput",
    VIDEO_INPUT = "videoinput"
}

export interface Vendor {
    /**
     * name of the vendor
     */
    name: string;
    /**
     * url for the vendor
     */
    url: string;
}

export interface Model {
    /**
     * name of the model
     */
    name: string;
    /**
     * url for the model
     */
    url: string;
}

export class CertifiedDevice extends Base {
    /**
     * the type of device
     */
    public type: DeviceType;
    /**
     * the device's Windows UUID
     */
    public id: string;
    /**
     * the hardware vendor
     */
    public vendor: Vendor;
    /**
     * the model of the product
     */
    public model: Model;
    /**
     * UUIDs of related devices
     */
    public related: string[];
    /**
     * if the device's native echo cancellation is enabled
     */
    public echo_cancellation?: boolean;
    /**
     * if the device's native noise suppression is enabled
     */
    public noise_suppression?: boolean;
    /**
     * if the device's native automatic gain control is enabled
     */
    public automatic_gain_control?: boolean;
    /**
     * if the device is hardware muted
     */
    public hardware_mute?: boolean;

    constructor(client: Client, props: Record<string, any>) {
        super(client);
        Object.assign(this, props);

        this.type = props.type;
        this.id = props.id;
        this.vendor = props.vendor;
        this.model = props.model;
        this.related = props.related;
    }
}
