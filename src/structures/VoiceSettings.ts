import { Client } from "../Client";
import { Base } from "./Base";

export enum KEY_TYPE {
    KEYBOARD_KEY,
    MOUSE_BUTTON,
    KEYBOARD_MODIFIER_KEY,
    GAMEPAD_BUTTON
}

export interface ShortcutKeyCombo {
    type: KEY_TYPE;
    code: number;
    name: string;
}

export interface Device {
    id: string;
    name: string;
}

export interface VoiceInput {
    device_id: string;
    volume: number;
    readonly available_devices: Device[];
}

export interface VoiceOutput {
    device_id: string;
    volume: number;
    readonly available_devices: Device[];
}

export interface VoiceMode {
    type: "PUSH_TO_TALK" | "VOICE_ACTIVITY";
    auto_threshold: boolean;
    threshold: number;
    shortcut: ShortcutKeyCombo[];
    delay: number;
}

export class VoiceSettings extends Base {
    input: VoiceInput;
    output: VoiceOutput;
    mode: any;
    automatic_gain_control: boolean;
    echo_cancellation: boolean;
    noise_suppression: boolean;
    qos: boolean;
    silence_warning: boolean;
    deaf: boolean;
    mute: boolean;

    constructor(client: Client, props: any) {
        super(client);
        Object.assign(this, props);

        this.input = props.input;
        this.output = props.output;
        this.mode = props.mode;
        this.automatic_gain_control = props.automatic_gain_control;
        this.echo_cancellation = props.echo_cancellation;
        this.noise_suppression = props.noise_suppression;
        this.qos = props.qos;
        this.silence_warning = props.silence_warning;
        this.deaf = props.deaf;
        this.mute = props.mute;
    }
}
