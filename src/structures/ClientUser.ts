import { ActivityType, GatewayActivityButton } from "discord-api-types/v10";
import type { CertifiedDevice } from "./CertifiedDevice";
import { VoiceSettings } from "./VoiceSettings";
import { Channel } from "./Channel";
import { Guild } from "./Guild";
import { User } from "./User";

export enum ActivitySupportedPlatform {
    IOS = "ios",
    ANDROID = "android",
    WEB = "web"
}

export enum ActivityPartyPrivacy {
    PRIVATE = 0,
    PUBLIC = 1
}

export enum StatusDisplayType {
    ACTIVITY_NAME = 0,
    ACTIVITY_STATE = 1,
    ACTIVITY_DETAILS = 2
}

export type SetActivity = {
    name?: string;
    type?: ActivityType;
    url?: string;

    state?: string;
    stateUrl?: string;
    details?: string;
    detailsUrl?: string;

    startTimestamp?: number | Date;
    endTimestamp?: number | Date;

    largeImageKey?: string;
    largeImageUrl?: string;
    smallImageKey?: string;
    smallImageUrl?: string;
    largeImageText?: string;
    smallImageText?: string;

    partyId?: string;
    partySize?: number;
    partyMax?: number;

    matchSecret?: string;
    joinSecret?: string;
    spectateSecret?: string;

    instance?: boolean;
    buttons?: GatewayActivityButton[];
    supportedPlatforms?: (ActivitySupportedPlatform | `${ActivitySupportedPlatform}`)[];

    statusDisplayType?: StatusDisplayType;
    applicationId?: string;
    flags?: number;

    emoji?: {
        name: string;
        id?: string;
        animated?: boolean;
    };
};

export type SetActivityResponse = {
    state?: string;
    buttons?: string[];
    name: string;
    application_id: string;
    type: number;
    metadata: {
        button_urls?: string[];
    };
};

export class ClientUser extends User {
    // #region Helper function

    public async fetchUser(userId: string): Promise<User> {
        return new User(this.client, (await this.client.request("GET_USER", { id: userId })).data);
    }

    /**
     * Used to get a guild the client is in.
     *
     * @param guildId - id of the guild to get
     * @param timeout - asynchronously get guild with time to wait before timing out
     * @returns partial guild
     */
    public async fetchGuild(guildId: string, timeout?: number): Promise<Guild> {
        return new Guild(this.client, (await this.client.request("GET_GUILD", { guild_id: guildId, timeout })).data);
    }

    /**
     * Used to get a list of guilds the client is in.
     * @returns the guilds the user is in
     */
    public async fetchGuilds(): Promise<Guild[]> {
        return (await this.client.request("GET_GUILDS")).data.guilds.map(
            (guildData: any) => new Guild(this.client, guildData)
        );
    }

    /**
     * Used to get a channel the client is in.
     * @param channelId - id of the channel to get
     * @returns partial channel
     */
    public async fetchChannel(channelId: string): Promise<Channel> {
        return new Channel(this.client, (await this.client.request("GET_CHANNEL", { channel_id: channelId })).data);
    }

    /**
     * Used to get a guild's channels the client is in.
     * @param guildId - id of the guild to get channels for
     * @returns guild channels the user is in
     */
    public async fetchChannels(guildId: string): Promise<Channel[]> {
        return (await this.client.request("GET_CHANNELS", { guild_id: guildId })).data.channels.map(
            (channelData: any) => new Channel(this.client, channelData)
        );
    }

    /**
     * Used to get the client's current voice channel. There are no arguments for this command. Returns the [Get Channel](https://discord.com/developers/docs/topics/rpc#getchannel) response, or `null` if none.
     * @returns the client's current voice channel, `null` if none
     */
    public async getSelectedVoiceChannel(): Promise<Channel | null> {
        const response = await this.client.request("GET_SELECTED_VOICE_CHANNEL");
        return response.data !== null ? new Channel(this.client, response.data) : null;
    }

    /**
     * Used to join voice channels, group dms, or dms. Returns the [Get Channel](https://discord.com/developers/docs/topics/rpc#getchannel) response, `null` if none.
     * @param channelId - channel id to join
     * @param timeout - asynchronously join channel with time to wait before timing out
     * @param force - forces a user to join a voice channel
     * @returns the channel that the user joined, `null` if none
     */
    public async selectVoiceChannel(
        channelId: string | null,
        timeout: number,
        force: boolean,
        navigate: boolean
    ): Promise<Channel> {
        return new Channel(
            this.client,
            (
                await this.client.request("SELECT_VOICE_CHANNEL", {
                    channel_id: channelId,
                    timeout,
                    force,
                    navigate
                })
            ).data
        );
    }

    /**
     * Used to leave voice channels, group dms, or dms
     * @param timeout - asynchronously join channel with time to wait before timing out
     * @param force - forces a user to join a voice channel
     */
    public async leaveVoiceChannel(timeout?: number, force?: boolean): Promise<void> {
        await this.client.request("SELECT_VOICE_CHANNEL", {
            channel_id: null,
            timeout,
            force
        });
    }

    /**
     * Used to get current client's voice settings
     * @returns the voice setting
     */
    public async getVoiceSettings(): Promise<VoiceSettings> {
        return new VoiceSettings(this.client, (await this.client.request("GET_VOICE_SETTINGS")).data);
    }

    /**
     * Used by hardware manufacturers to send information about the current state of their certified devices that are connected to Discord.
     * @param devices - a list of devices for your manufacturer, in order of priority
     * @returns
     */
    public async setCeritfiedDevices(devices: CertifiedDevice[]): Promise<void> {
        await this.client.request("SET_CERTIFIED_DEVICES", { devices });
    }

    /**
     * Used to accept an Ask to Join request.
     * @param userId - the id of the requesting user
     */
    public async sendJoinInvite(userId: string): Promise<void> {
        await this.client.request("SEND_ACTIVITY_JOIN_INVITE", { user_id: userId });
    }

    /**
     * Used to reject an Ask to Join request.
     * @param userId - the id of the requesting user
     */
    public async closeJoinRequest(userId: string): Promise<void> {
        await this.client.request("CLOSE_ACTIVITY_JOIN_REQUEST", { user_id: userId });
    }

    /**
     * Used to join text channels, group dms, or dms. Returns the [Get Channel](https://discord.com/developers/docs/topics/rpc#getchannel) response, or `null` if none.
     * @param channelId - channel id to join
     * @param timeout - asynchronously join channel with time to wait before timing out
     * @returns the text channel that user joined
     */
    public async selectTextChannel(channelId: string | null, timeout: number): Promise<Channel | null> {
        return new Channel(
            this.client,
            (await this.client.request("SELECT_TEXT_CHANNEL", { channel_id: channelId, timeout })).data
        );
    }

    /**
     * Used to leave text channels, group dms, or dms.
     * @param timeout - asynchronously join channel with time to wait before timing out
     */
    public async leaveTextChannel(timeout?: number): Promise<void> {
        await this.client.request("SELECT_TEXT_CHANNEL", { channel_id: null, timeout });
    }

    public async getRelationships(): Promise<Array<User>> {
        return (await this.client.request("GET_RELATIONSHIPS")).data.relationships.map((data: any) => {
            return new User(this.client, { ...data.user, presence: data.presence });
        });
    }

    /**
     * Used to update a user's Rich Presence.
     *
     * @param activity - the rich presence to assign to the user
     * @param pid - the application's process id
     * @returns The activity that have been set
     */
    public async setActivity(activity: SetActivity, pid?: number): Promise<SetActivityResponse> {
        const formattedActivity: any = {
            name: activity.name,
            type: activity.type ?? ActivityType.Playing,
            created_at: Date.now(),
            instance: !!activity.instance
        };

        // URL only for Streaming activity
        if (activity.type === ActivityType.Streaming && activity.url) {
            formattedActivity.url = activity.url;
        }

        // Details & state
        if (activity.details) formattedActivity.details = activity.details;
        if (activity.state) formattedActivity.state = activity.state;
        if (activity.detailsUrl) formattedActivity.details_url = activity.detailsUrl;
        if (activity.stateUrl) formattedActivity.state_url = activity.stateUrl;

        // Timestamps (only if any defined)
        if (activity.startTimestamp || activity.endTimestamp) {
            formattedActivity.timestamps = {};
            if (activity.startTimestamp instanceof Date) {
                formattedActivity.timestamps.start = activity.startTimestamp.getTime();
            } else if (typeof activity.startTimestamp === "number") {
                formattedActivity.timestamps.start = activity.startTimestamp;
            }

            if (activity.endTimestamp instanceof Date) {
                formattedActivity.timestamps.end = activity.endTimestamp.getTime();
            } else if (typeof activity.endTimestamp === "number") {
                formattedActivity.timestamps.end = activity.endTimestamp;
            }
        }

        // Assets (only if any defined)
        if (activity.largeImageKey || activity.smallImageKey || activity.largeImageText || activity.smallImageText || activity.largeImageUrl || activity.smallImageUrl) {
            formattedActivity.assets = {};
            if (activity.largeImageKey) formattedActivity.assets.large_image = activity.largeImageKey;
            if (activity.smallImageKey) formattedActivity.assets.small_image = activity.smallImageKey;
            if (activity.largeImageText) formattedActivity.assets.large_text = activity.largeImageText;
            if (activity.smallImageText) formattedActivity.assets.small_text = activity.smallImageText;
            if (activity.largeImageUrl) formattedActivity.assets.large_url = activity.largeImageUrl;
            if (activity.smallImageUrl) formattedActivity.assets.small_url = activity.smallImageUrl;
        }

        // Status display type
        if (activity.statusDisplayType !== undefined) {
            formattedActivity.status_display_type = activity.statusDisplayType;
        }

        // Party (only if any defined)
        if (activity.partyId || activity.partySize || activity.partyMax) {
            formattedActivity.party = {};
            if (activity.partyId) formattedActivity.party.id = activity.partyId;
            if (activity.partySize !== undefined && activity.partyMax !== undefined) {
                formattedActivity.party.size = [activity.partySize, activity.partyMax];
            }
        }

        // Secrets (only if any defined)
        if (activity.joinSecret || activity.spectateSecret || activity.matchSecret) {
            formattedActivity.secrets = {};
            if (activity.joinSecret) formattedActivity.secrets.join = activity.joinSecret;
            if (activity.spectateSecret) formattedActivity.secrets.spectate = activity.spectateSecret;
            if (activity.matchSecret) formattedActivity.secrets.match = activity.matchSecret;
        }

        // Buttons
        if (activity.buttons?.length) {
            formattedActivity.buttons = activity.buttons;
        }

        // Supported platforms
        if (activity.supportedPlatforms?.length) {
            formattedActivity.supported_platforms = activity.supportedPlatforms;
        }

        return (
            await this.client.request("SET_ACTIVITY", {
                pid: pid ?? process?.pid ?? 0,
                activity: formattedActivity
            })
        ).data;
    }

    /**
     * Used to clear a user's Rich Presence.
     *
     * @param pid - the application's process id
     */
    public async clearActivity(pid?: number): Promise<void> {
        await this.client.request("SET_ACTIVITY", { pid: (pid ?? process) ? (process.pid ?? 0) : 0 });
    }

    // #region Undocumented
    // This region holds method that are not documented by Discord BUT does exist

    // Also most of this might not even be correct, use at your own risk

    /**
     * Used to get a user's avatar
     * @param userId - id of the user to get the avatar of
     * @param format - image format
     * @param size - image size
     * @return base64 encoded image data
     */
    public async getImage(
        userId: string,
        format: "png" | "webp" | "jpg" = "png",
        size: 16 | 32 | 64 | 128 | 256 | 512 | 1024 = 1024
    ): Promise<string> {
        return (await this.client.request("GET_IMAGE", { type: "user", id: userId, format, size })).data.data_url;
    }

    /**
     * Requires RPC and RPC_VOICE_WRITE
     * @returns
     */
    public async getSoundboardSounds(): Promise<any> {
        return (await this.client.request("GET_SOUNDBOARD_SOUNDS")).data;
    }

    /**
     * Requires RPC and RPC_VOICE_WRITE
     * @returns
     */
    public async playSoundboardSound(guildId: string, soundId: string): Promise<any> {
        return (
            await this.client.request("PLAY_SOUNDBOARD_SOUND", {
                guild_id: guildId,
                sound_id: soundId
            })
        ).data;
    }

    /**
     * Requires RPC and RPC_VIDEO_WRITE
     * @returns
     */
    public async toggleVideo(): Promise<any> {
        return (await this.client.request("TOGGLE_VIDEO")).data;
    }

    /**
     * Requires RPC and RPC_SCREENSHARE_WRITE
     * @returns
     */
    public async toggleScreenshare(pid?: number): Promise<any> {
        return (await this.client.request("TOGGLE_SCREENSHARE", { pid })).data;
    }

    /**
     * Requires RPC and RPC_VOICE_WRITE
     * @returns
     */
    public async setPushToTalk(active: boolean): Promise<any> {
        return (await this.client.request("PUSH_TO_TALK", { active })).data;
    }

    /**
     * Requires RPC and RPC_VOICE_WRITE
     * @returns
     */
    public async setVoiceSettings(req: {
        user_id: string;
        pan: {
            left: number;
            right: number;
        };
        // 0 - 200
        volume: number;
        mute: boolean;
    }): Promise<any> {
        return (await this.client.request("SET_VOICE_SETTINGS", req)).data;
    }

    /**
     * Requires RPC and RPC_VOICE_WRITE
     * @returns
     */
    public async setVoiceSettings2(req: {
        input_mode: { type: "PUSH_TO_TALK" | "VOICE_ACTIVITY"; shortcut: string };
        self_mute: boolean;
        self_deaf: boolean;
    }): Promise<any> {
        return (await this.client.request("SET_VOICE_SETTINGS_2", req)).data;
    }

    /**
     * Requires RPC and RPC_GUILDS_MEMBERS_READ
     * @returns
     */
    public async getChannelPermissions(): Promise<{ permissions: any }> {
        return (await this.client.request("GET_CHANNEL_PERMISSIONS")).data;
    }

    public async getActivityInstanceConnectedParticipants(): Promise<{ participants: { nickname: string }[] }> {
        return (await this.client.request("GET_ACTIVITY_INSTANCE_CONNECTED_PARTICIPANTS")).data;
    }

    public async navigateToConnections(): Promise<any> {
        return (await this.client.request("NAVIGATE_TO_CONNECTIONS")).data;
    }

    public async createChanenlInvite(channelId: string, args: object): Promise<any> {
        return (await this.client.request("CREATE_CHANNEL_INVITE", { channel_id: channelId, ...args })).data;
    }

    public async openExternalLink(url: string): Promise<any> {
        return (await this.client.request("OPEN_EXTERNAL_LINK", { url })).data;
    }

    public async getPlatformBehaviors(): Promise<{ iosKeyboardResizesView: boolean }> {
        return (await this.client.request("GET_PLATFORM_BEHAVIORS")).data;
    }

    public async getProviderAccessToken(provider: string, connectionRedirect: string): Promise<any> {
        return (await this.client.request("GET_PROVIDER_ACCESS_TOKEN", { provider, connectionRedirect })).data;
    }

    public async maybeGetProviderAccessToken(provider: string): Promise<any> {
        return (await this.client.request("MAYBE_GET_PROVIDER_ACCESS_TOKEN", { provider })).data;
    }

    public async getSKUS(): Promise<any> {
        return (await this.client.request("GET_SKUS")).data;
    }

    public async getEntitlements(): Promise<any> {
        return (await this.client.request("GET_ENTITLEMENTS")).data;
    }

    public async getSKUsEmbedded(): Promise<{ skus: any }> {
        return (await this.client.request("GET_SKUS_EMBEDDED")).data;
    }

    public async getEntitlementsEmbedded(): Promise<{ entitlements: any }> {
        return (await this.client.request("GET_ENTITLEMENTS_EMBEDDED")).data;
    }

    public async encourageHardwareAcceleration(): Promise<any> {
        return (await this.client.request("ENCOURAGE_HW_ACCELERATION")).data;
    }

    public async captureLog(level: "log" | "warn" | "debug" | "info" | "error", message: string): Promise<any> {
        return (await this.client.request("CAPTURE_LOG", { level, message })).data;
    }

    public async sendAnalyticsEvent(eventName: string, eventProperties: object): Promise<any> {
        return (await this.client.request("SEND_ANALYTICS_EVENT", { eventName, eventProperties })).data;
    }

    public async getLocale(): Promise<string> {
        return (await this.client.request("USER_SETTINGS_GET_LOCALE")).data.locale;
    }

    public async getAchievements(): Promise<any> {
        return (await this.client.request("GET_USER_ACHIEVEMENTS")).data;
    }

    public async setAchievement(achievementId: string, percentComplete: number): Promise<any> {
        return (
            await this.client.request("SET_USER_ACHIEVEMENT", {
                achievement_id: achievementId,
                percent_complete: percentComplete
            })
        ).data;
    }

    public async createNetworkingToken(): Promise<any> {
        return (await this.client.request("NETWORKING_CREATE_TOKEN")).data;
    }

    public async networkingPeerMetrics(): Promise<any> {
        return (await this.client.request("NETWORKING_PEER_METRICS")).data;
    }

    public async networkingSystemMetrics(): Promise<any> {
        return (await this.client.request("NETWORKING_SYSTEM_METRICS")).data;
    }

    public async getNetworkingConfig(): Promise<{ address: any; token: any }> {
        return (await this.client.request("GET_NETWORKING_CONFIG")).data;
    }

    public async startPurchase(skuId: string, pid: number): Promise<any> {
        return (await this.client.request("START_PURCHASE", { sku_id: skuId, pid })).data;
    }

    public async startPremiumPurchase(pid: number): Promise<any> {
        return (await this.client.request("START_PREMIUM_PURCHASE", { pid })).data;
    }

    public async getApplicationTicket(): Promise<any> {
        return (await this.client.request("GET_APPLICATION_TICKET")).data;
    }

    public async getEntitlementTicket(): Promise<any> {
        return (await this.client.request("GET_ENTITLEMENT_TICKET")).data;
    }

    public async validateApplication(): Promise<any> {
        return (await this.client.request("VALIDATE_APPLICATION")).data;
    }

    public async openOverlayVoiceSettings(pid: number): Promise<any> {
        return (await this.client.request("OPEN_OVERLAY_VOICE_SETTINGS", { pid })).data;
    }

    public async openOverlayGuildInvite(code: string, pid: number): Promise<any> {
        return (await this.client.request("OPEN_OVERLAY_GUILD_INVITE", { code, pid })).data;
    }

    public async openOverlayActivityInvite(type: "JOIN", pid: number): Promise<any> {
        const typeToNumber = {
            JOIN: 0
        };

        return (await this.client.request("OPEN_OVERLAY_ACTIVITY_INVITE", { type: typeToNumber[type], pid })).data;
    }

    public async setOverlayLocked(locked: boolean, pid: number): Promise<any> {
        return (await this.client.request("SET_OVERLAY_LOCKED", { locked, pid })).data;
    }

    public async browserHandoff(): Promise<any> {
        return (await this.client.request("BROWSER_HANDOFF")).data;
    }

    public async openGuildTemplateBrowser(code: any): Promise<any> {
        return (await this.client.request("GUILD_TEMPLATE_BROWSER", { code })).data;
    }

    public async openGiftCodeBrowser(code: any): Promise<any> {
        return (await this.client.request("GIFT_CODE_BROWSER", { code })).data;
    }

    public async brainTreePopupBridgeCallback(state: any, path: any, query: any): Promise<any> {
        return (await this.client.request("BRAINTREE_POPUP_BRIDGE_CALLBACK", { state, path, query })).data;
    }

    public async billingPopupBridgeCallback(state: any, path: any, query: any, paymentSourceType: any): Promise<any> {
        return (
            await this.client.request("BILLING_POPUP_BRIDGE_CALLBACK", {
                state,
                path,
                query,
                payment_source_type: paymentSourceType
            })
        ).data;
    }

    public async connectionsCallback(providerType: any, code: any, openIdParams: any, state: any): Promise<any> {
        return (
            await this.client.request("CONNECTIONS_CALLBACK", {
                providerType: providerType,
                code,
                open_id_params: openIdParams,
                state
            })
        ).data;
    }

    public async deepLink(type: any, params: any): Promise<any> {
        return (await this.client.request("DEEP_LINK", { type, params })).data;
    }

    public async inviteBrowser(code: any): Promise<any> {
        return (await this.client.request("INVITE_BROWSER", { code })).data;
    }

    public async initiateImageUpload(): Promise<{ image_url: string }> {
        return (await this.client.request("INITIATE_IMAGE_UPLOAD")).data;
    }

    public async openShareMomentDialog(mediaUrl: string): Promise<any> {
        return (await this.client.request("OPEN_SHARE_MOMENT_DIALOG", { mediaUrl })).data;
    }

    public async openInviteDialog(): Promise<any> {
        return (await this.client.request("OPEN_INVITE_DIALOG")).data;
    }

    public async acceptActivityInvite(
        type: "JOIN",
        userId: string,
        sessionId: string,
        channelId: string,
        messageId: string
    ): Promise<any> {
        const typeToNumber = {
            JOIN: 0
        };

        return (
            await this.client.request("ACCEPT_ACTIVITY_INVITE", {
                type: typeToNumber[type],
                user_id: userId,
                session_id: sessionId,
                channel_id: channelId,
                message_id: messageId
            })
        ).data;
    }

    public async activityInviteUser(userId: string, type: "JOIN", content: string, pid: number): Promise<any> {
        const typeToNumber = {
            JOIN: 0
        };

        return (
            await this.client.request("ACTIVITY_INVITE_USER", {
                user_id: userId,
                type: typeToNumber[type],
                content,
                pid
            })
        ).data;
    }

    public async closeActivityJoinRequest(userId: string): Promise<any> {
        return (await this.client.request("CLOSE_ACTIVITY_JOIN_REQUEST", { user_id: userId })).data;
    }

    public async sendActivityJoinInvite(userId: string, pid: number): Promise<any> {
        return (await this.client.request("SEND_ACTIVITY_JOIN_INVITE", { user_id: userId, pid })).data;
    }

    public async setConfig(useInteractivePip: boolean): Promise<any> {
        return (await this.client.request("SET_CONFIG", { use_interactive_pip: useInteractivePip })).data;
    }

    // #endregion

    // #endregion
}
