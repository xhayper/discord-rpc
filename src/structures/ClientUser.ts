import type { ActivityType, GatewayActivityButton } from "discord-api-types/v10";
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

export type SetActivity = {
    /**
     * Minimum of 2 characters and maximum of 128 characters
     */
    state?: string;
    /**
     * Minimum of 2 characters and maximum of 128 characters
     */
    details?: string;
    startTimestamp?: number | Date;
    endTimestamp?: number | Date;
    /**
     * Minimum of 1 characters and maximum of 128 characters
     */
    largeImageKey?: string;
    /**
     * Minimum of 1 characters and maximum of 128 characters
     */
    smallImageKey?: string;
    /**
     * Minimum of 2 characters and maximum of 128 characters
     */
    largeImageText?: string;
    /**
     * Minimum of 2 characters and maximum of 128 characters
     */
    smallImageText?: string;
    /**
     * Minimum of 2 characters and maximum of 128 characters
     */
    partyId?: string;
    /**
     * Default: ActivityPartyPrivacy.PRIVATE
     */
    partyPrivacy?: ActivityPartyPrivacy;
    partySize?: number;
    partyMax?: number;
    /**
     * Minimum of 2 characters and maximum of 128 characters
     */
    matchSecret?: string;
    /**
     * Minimum of 2 characters and maximum of 128 characters
     */
    joinSecret?: string;
    /**
     * Minimum of 2 characters and maximum of 128 characters
     */
    spectateSecret?: string;
    instance?: boolean;
    buttons?: Array<GatewayActivityButton>;
    supportedPlatforms?: (ActivitySupportedPlatform | `${ActivitySupportedPlatform}`)[];
    /**
     * Default: ActivityTypes.PLAYING
     */
    type?: ActivityType.Playing | ActivityType.Listening | ActivityType.Watching | ActivityType.Competing;
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

    async fetchUser(userId: string): Promise<User> {
        return new User(this.client, (await this.client.request("GET_USER", { id: userId })).data);
    }

    /**
     * Used to get a guild the client is in.
     *
     * @param guildId - id of the guild to get
     * @param timeout - asynchronously get guild with time to wait before timing out
     * @returns partial guild
     */
    async fetchGuild(guildId: string, timeout?: number): Promise<Guild> {
        return new Guild(this.client, (await this.client.request("GET_GUILD", { guild_id: guildId, timeout })).data);
    }

    /**
     * Used to get a list of guilds the client is in.
     * @returns the guilds the user is in
     */
    async fetchGuilds(): Promise<Guild[]> {
        return (await this.client.request("GET_GUILDS")).data.guilds.map(
            (guildData: any) => new Guild(this.client, guildData)
        );
    }

    /**
     * Used to get a channel the client is in.
     * @param channelId - id of the channel to get
     * @returns partial channel
     */
    async fetchChannel(channelId: string): Promise<Channel> {
        return new Channel(this.client, (await this.client.request("GET_CHANNEL", { channel_id: channelId })).data);
    }

    /**
     * Used to get a guild's channels the client is in.
     * @param guildId - id of the guild to get channels for
     * @returns guild channels the user is in
     */
    async fetchChannels(guildId: string): Promise<Channel[]> {
        return (await this.client.request("GET_CHANNELS", { guild_id: guildId })).data.channels.map(
            (channelData: any) => new Channel(this.client, channelData)
        );
    }

    /**
     * Used to get the client's current voice channel. There are no arguments for this command. Returns the [Get Channel](https://discord.com/developers/docs/topics/rpc#getchannel) response, or `null` if none.
     * @returns the client's current voice channel, `null` if none
     */
    async getSelectedVoiceChannel(): Promise<Channel | null> {
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
    async selectVoiceChannel(
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
    async leaveVoiceChannel(timeout?: number, force?: boolean): Promise<void> {
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
    async getVoiceSettings(): Promise<VoiceSettings> {
        return new VoiceSettings(this.client, (await this.client.request("GET_VOICE_SETTINGS")).data);
    }

    /**
     * Used by hardware manufacturers to send information about the current state of their certified devices that are connected to Discord.
     * @param devices - a list of devices for your manufacturer, in order of priority
     * @returns
     */
    async setCeritfiedDevices(devices: CertifiedDevice[]): Promise<void> {
        await this.client.request("SET_CERTIFIED_DEVICES", { devices });
    }

    /**
     * Used to accept an Ask to Join request.
     * @param userId - the id of the requesting user
     */
    async sendJoinInvite(userId: string): Promise<void> {
        await this.client.request("SEND_ACTIVITY_JOIN_INVITE", { user_id: userId });
    }

    /**
     * Used to reject an Ask to Join request.
     * @param userId - the id of the requesting user
     */
    async closeJoinRequest(userId: string): Promise<void> {
        await this.client.request("CLOSE_ACTIVITY_JOIN_REQUEST", { user_id: userId });
    }

    /**
     * Used to join text channels, group dms, or dms. Returns the [Get Channel](https://discord.com/developers/docs/topics/rpc#getchannel) response, or `null` if none.
     * @param channelId - channel id to join
     * @param timeout - asynchronously join channel with time to wait before timing out
     * @returns the text channel that user joined
     */
    async selectTextChannel(channelId: string | null, timeout: number): Promise<Channel | null> {
        return new Channel(
            this.client,
            (await this.client.request("SELECT_TEXT_CHANNEL", { channel_id: channelId, timeout })).data
        );
    }

    /**
     * Used to leave text channels, group dms, or dms.
     * @param timeout - asynchronously join channel with time to wait before timing out
     */
    async leaveTextChannel(timeout?: number): Promise<void> {
        await this.client.request("SELECT_TEXT_CHANNEL", { channel_id: null, timeout });
    }

    async getRelationships(): Promise<Array<User>> {
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
    async setActivity(activity: SetActivity, pid?: number): Promise<SetActivityResponse> {
        const formattedAcitivity: any = {
            ...activity,
            assets: {},
            timestamps: {},
            party: {},
            secrets: {}
        };

        if (activity.startTimestamp instanceof Date) {
            formattedAcitivity.timestamps.start = Math.round(activity.startTimestamp.getTime());
        } else if (typeof activity.startTimestamp === "number") {
            formattedAcitivity.timestamps.start = activity.startTimestamp;
        }

        if (activity.endTimestamp instanceof Date) {
            formattedAcitivity.timestamps.end = Math.round(activity.endTimestamp.getTime());
        } else if (typeof activity.endTimestamp === "number") {
            formattedAcitivity.timestamps.end = activity.endTimestamp;
        }

        if (activity.largeImageKey) formattedAcitivity.assets.large_image = activity.largeImageKey;
        if (activity.smallImageKey) formattedAcitivity.assets.small_image = activity.smallImageKey;
        if (activity.largeImageText) formattedAcitivity.assets.large_text = activity.largeImageText;
        if (activity.smallImageText) formattedAcitivity.assets.small_text = activity.smallImageText;

        if (activity.partyId) formattedAcitivity.party.id = activity.partyId;
        if (activity.partyPrivacy) formattedAcitivity.party.privacy = activity.partyPrivacy;
        if (activity.partySize && activity.partyMax)
            formattedAcitivity.party.size = [activity.partySize, activity.partyMax];

        if (activity.joinSecret) formattedAcitivity.secrets.join = activity.joinSecret;
        if (activity.spectateSecret) formattedAcitivity.secrets.spectate = activity.spectateSecret;
        if (activity.matchSecret) formattedAcitivity.secrets.match = activity.matchSecret;

        if (activity.supportedPlatforms) formattedAcitivity.supported_platforms = activity.supportedPlatforms;

        if (Object.keys(formattedAcitivity.assets).length === 0) delete formattedAcitivity["assets"];
        if (Object.keys(formattedAcitivity.timestamps).length === 0) delete formattedAcitivity["timestamps"];
        if (Object.keys(formattedAcitivity.party).length === 0) delete formattedAcitivity["party"];
        if (Object.keys(formattedAcitivity.secrets).length === 0) delete formattedAcitivity["secrets"];

        formattedAcitivity.instance = !!activity.instance;

        // Clean-up
        delete formattedAcitivity["startTimestamp"];
        delete formattedAcitivity["endTimestamp"];
        delete formattedAcitivity["largeImageKey"];
        delete formattedAcitivity["smallImageKey"];
        delete formattedAcitivity["largeImageText"];
        delete formattedAcitivity["smallImageText"];
        delete formattedAcitivity["partyId"];
        delete formattedAcitivity["partyPrivacy"];
        delete formattedAcitivity["partySize"];
        delete formattedAcitivity["partyMax"];
        delete formattedAcitivity["joinSecret"];
        delete formattedAcitivity["spectateSecret"];
        delete formattedAcitivity["matchSecret"];
        delete formattedAcitivity["supportedPlatforms"];

        return (
            await this.client.request("SET_ACTIVITY", {
                pid: (pid ?? process) ? (process.pid ?? 0) : 0,
                activity: formattedAcitivity
            })
        ).data;
    }

    /**
     * Used to clear a user's Rich Presence.
     *
     * @param pid - the application's process id
     */
    async clearActivity(pid?: number): Promise<void> {
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
    async getImage(
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
    async getSoundboardSounds(): Promise<any> {
        return (await this.client.request("GET_SOUNDBOARD_SOUNDS")).data;
    }

    /**
     * Requires RPC and RPC_VOICE_WRITE
     * @returns
     */
    async playSoundboardSound(guildId: string, soundId: string): Promise<any> {
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
    async toggleVideo(): Promise<any> {
        return (await this.client.request("TOGGLE_VIDEO")).data;
    }

    /**
     * Requires RPC and RPC_SCREENSHARE_WRITE
     * @returns
     */
    async toggleScreenshare(pid?: number): Promise<any> {
        return (await this.client.request("TOGGLE_SCREENSHARE", { pid })).data;
    }

    /**
     * Requires RPC and RPC_VOICE_WRITE
     * @returns
     */
    async setPushToTalk(active: boolean): Promise<any> {
        return (await this.client.request("PUSH_TO_TALK", { active })).data;
    }

    /**
     * Requires RPC and RPC_VOICE_WRITE
     * @returns
     */
    async setVoiceSettings(req: {
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
    async setVoiceSettings2(req: {
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
    async getChannelPermissions(): Promise<{ permissions: any }> {
        return (await this.client.request("GET_CHANNEL_PERMISSIONS")).data;
    }

    async getActivityInstanceConnectedParticipants(): Promise<{ participants: { nickname: string }[] }> {
        return (await this.client.request("GET_ACTIVITY_INSTANCE_CONNECTED_PARTICIPANTS")).data;
    }

    async navigateToConnections(): Promise<any> {
        return (await this.client.request("NAVIGATE_TO_CONNECTIONS")).data;
    }

    async createChanenlInvite(channelId: string, args: object): Promise<any> {
        return (await this.client.request("CREATE_CHANNEL_INVITE", { channel_id: channelId, ...args })).data;
    }

    async openExternalLink(url: string): Promise<any> {
        return (await this.client.request("OPEN_EXTERNAL_LINK", { url })).data;
    }

    async getPlatformBehaviors(): Promise<{ iosKeyboardResizesView: boolean }> {
        return (await this.client.request("GET_PLATFORM_BEHAVIORS")).data;
    }

    async getProviderAccessToken(provider: string, connectionRedirect: string): Promise<any> {
        return (await this.client.request("GET_PROVIDER_ACCESS_TOKEN", { provider, connectionRedirect })).data;
    }

    async maybeGetProviderAccessToken(provider: string): Promise<any> {
        return (await this.client.request("MAYBE_GET_PROVIDER_ACCESS_TOKEN", { provider })).data;
    }

    async getSKUS(): Promise<any> {
        return (await this.client.request("GET_SKUS")).data;
    }

    async getEntitlements(): Promise<any> {
        return (await this.client.request("GET_ENTITLEMENTS")).data;
    }

    async getSKUsEmbedded(): Promise<{ skus: any }> {
        return (await this.client.request("GET_SKUS_EMBEDDED")).data;
    }

    async getEntitlementsEmbedded(): Promise<{ entitlements: any }> {
        return (await this.client.request("GET_ENTITLEMENTS_EMBEDDED")).data;
    }

    async encourageHardwareAcceleration(): Promise<any> {
        return (await this.client.request("ENCOURAGE_HW_ACCELERATION")).data;
    }

    async captureLog(level: "log" | "warn" | "debug" | "info" | "error", message: string): Promise<any> {
        return (await this.client.request("CAPTURE_LOG", { level, message })).data;
    }

    async sendAnalyticsEvent(eventName: string, eventProperties: object): Promise<any> {
        return (await this.client.request("SEND_ANALYTICS_EVENT", { eventName, eventProperties })).data;
    }

    async getLocale(): Promise<string> {
        return (await this.client.request("USER_SETTINGS_GET_LOCALE")).data.locale;
    }

    async getAchievements(): Promise<any> {
        return (await this.client.request("GET_USER_ACHIEVEMENTS")).data;
    }

    async setAchievement(achievementId: string, percentComplete: number): Promise<any> {
        return (
            await this.client.request("SET_USER_ACHIEVEMENT", {
                achievement_id: achievementId,
                percent_complete: percentComplete
            })
        ).data;
    }

    async createNetworkingToken(): Promise<any> {
        return (await this.client.request("NETWORKING_CREATE_TOKEN")).data;
    }

    async networkingPeerMetrics(): Promise<any> {
        return (await this.client.request("NETWORKING_PEER_METRICS")).data;
    }

    async networkingSystemMetrics(): Promise<any> {
        return (await this.client.request("NETWORKING_SYSTEM_METRICS")).data;
    }

    async getNetworkingConfig(): Promise<{ address: any; token: any }> {
        return (await this.client.request("GET_NETWORKING_CONFIG")).data;
    }

    async startPurchase(skuId: string, pid: number): Promise<any> {
        return (await this.client.request("START_PURCHASE", { sku_id: skuId, pid })).data;
    }

    async startPremiumPurchase(pid: number): Promise<any> {
        return (await this.client.request("START_PREMIUM_PURCHASE", { pid })).data;
    }

    async getApplicationTicket(): Promise<any> {
        return (await this.client.request("GET_APPLICATION_TICKET")).data;
    }

    async getEntitlementTicket(): Promise<any> {
        return (await this.client.request("GET_ENTITLEMENT_TICKET")).data;
    }

    async validateApplication(): Promise<any> {
        return (await this.client.request("VALIDATE_APPLICATION")).data;
    }

    async openOverlayVoiceSettings(pid: number): Promise<any> {
        return (await this.client.request("OPEN_OVERLAY_VOICE_SETTINGS", { pid })).data;
    }

    async openOverlayGuildInvite(code: string, pid: number): Promise<any> {
        return (await this.client.request("OPEN_OVERLAY_GUILD_INVITE", { code, pid })).data;
    }

    async openOverlayActivityInvite(type: "JOIN", pid: number): Promise<any> {
        const typeToNumber = {
            JOIN: 0
        };

        return (await this.client.request("OPEN_OVERLAY_ACTIVITY_INVITE", { type: typeToNumber[type], pid })).data;
    }

    async setOverlayLocked(locked: boolean, pid: number): Promise<any> {
        return (await this.client.request("SET_OVERLAY_LOCKED", { locked, pid })).data;
    }

    async browserHandoff(): Promise<any> {
        return (await this.client.request("BROWSER_HANDOFF")).data;
    }

    async openGuildTemplateBrowser(code: any): Promise<any> {
        return (await this.client.request("GUILD_TEMPLATE_BROWSER", { code })).data;
    }

    async openGiftCodeBrowser(code: any): Promise<any> {
        return (await this.client.request("GIFT_CODE_BROWSER", { code })).data;
    }

    async brainTreePopupBridgeCallback(state: any, path: any, query: any): Promise<any> {
        return (await this.client.request("BRAINTREE_POPUP_BRIDGE_CALLBACK", { state, path, query })).data;
    }

    async billingPopupBridgeCallback(state: any, path: any, query: any, paymentSourceType: any): Promise<any> {
        return (
            await this.client.request("BILLING_POPUP_BRIDGE_CALLBACK", {
                state,
                path,
                query,
                payment_source_type: paymentSourceType
            })
        ).data;
    }

    async connectionsCallback(providerType: any, code: any, openIdParams: any, state: any): Promise<any> {
        return (
            await this.client.request("CONNECTIONS_CALLBACK", {
                providerType: providerType,
                code,
                open_id_params: openIdParams,
                state
            })
        ).data;
    }

    async deepLink(type: any, params: any): Promise<any> {
        return (await this.client.request("DEEP_LINK", { type, params })).data;
    }

    async inviteBrowser(code: any): Promise<any> {
        return (await this.client.request("INVITE_BROWSER", { code })).data;
    }

    async initiateImageUpload(): Promise<{ image_url: string }> {
        return (await this.client.request("INITIATE_IMAGE_UPLOAD")).data;
    }

    async openShareMomentDialog(mediaUrl: string): Promise<any> {
        return (await this.client.request("OPEN_SHARE_MOMENT_DIALOG", { mediaUrl })).data;
    }

    async openInviteDialog(): Promise<any> {
        return (await this.client.request("OPEN_INVITE_DIALOG")).data;
    }

    async acceptActivityInvite(
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

    async activityInviteUser(userId: string, type: "JOIN", content: string, pid: number): Promise<any> {
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

    async closeActivityJoinRequest(userId: string): Promise<any> {
        return (await this.client.request("CLOSE_ACTIVITY_JOIN_REQUEST", { user_id: userId })).data;
    }

    async sendActivityJoinInvite(userId: string, pid: number): Promise<any> {
        return (await this.client.request("SEND_ACTIVITY_JOIN_INVITE", { user_id: userId, pid })).data;
    }

    async setConfig(useInteractivePip: boolean): Promise<any> {
        return (await this.client.request("SET_CONFIG", { use_interactive_pip: useInteractivePip })).data;
    }

    // #endregion

    // #endregion
}
