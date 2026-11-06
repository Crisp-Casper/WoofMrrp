import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import { sendMessage } from "@utils/discord";
import definePlugin, { makeRange, OptionType } from "@utils/types";
import { UserStore } from "@webpack/common";

const logger = new Logger("ChannelInactivity");

let isRunning = false;
let inactivityTimer: ReturnType<typeof setTimeout> | undefined;
let lastAutomaticMessage: { content: string; expiresAt: number; } | undefined;

function scheduleInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = undefined;

    if (!isRunning) return;

    const channelId = settings.store.channelId.trim();
    if (!channelId) return;

    inactivityTimer = setTimeout(() => {
        inactivityTimer = undefined;
        void sendRandomMessage(channelId);
    }, settings.store.inactivityMinutes * 60_000);
}

async function sendRandomMessage(channelId: string) {
    const messages = settings.store.messages
        .split("\n")
        .map(message => message.trim())
        .filter(Boolean);

    if (messages.length === 0) {
        logger.error("No messages are configured; add at least one message in the plugin settings.");
        scheduleInactivityTimer();
        return;
    }

    const content = messages[Math.floor(Math.random() * messages.length)];
    lastAutomaticMessage = { content, expiresAt: Date.now() + 30_000 };

    try {
        await sendMessage(channelId, { content });
    } catch (error) {
        logger.error(`Failed to send an inactivity message to channel ${channelId}`, error);
        scheduleInactivityTimer();
    }
}

const settings = definePluginSettings({
    channelId: {
        type: OptionType.STRING,
        description: "Channel ID to monitor and send inactivity messages to",
        default: "",
        onChange: scheduleInactivityTimer
    },
    inactivityMinutes: {
        type: OptionType.SLIDER,
        description: "Minutes without a new message before sending",
        markers: makeRange(1, 20),
        default: 5,
        onChange: scheduleInactivityTimer
    },
    messages: {
        type: OptionType.STRING,
        description: "Messages to choose from (one per line)",
        default: "Anyone around?\nHow's everyone doing?\nIt's been quiet in here!",
        multiline: true
    }
});

export default definePlugin({
    name: "ChannelInactivity",
    description: "Sends a random message to a channel after a period of inactivity",
    authors: [],
    tags: ["Chat", "Utility"],
    settings,

    start() {
        isRunning = true;
        scheduleInactivityTimer();
    },

    stop() {
        isRunning = false;
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = undefined;
        lastAutomaticMessage = undefined;
    },

    flux: {
        MESSAGE_CREATE({ message }: {
            message: {
                channel_id: string;
                author: { id: string; };
                content: string;
            };
        }) {
            const channelId = settings.store.channelId.trim();
            if (message.channel_id !== channelId) return;

            const isOurAutomaticMessage =
                message.author.id === UserStore.getCurrentUser().id
                && message.content === lastAutomaticMessage?.content
                && Date.now() <= (lastAutomaticMessage?.expiresAt ?? 0);

            if (isOurAutomaticMessage) return;

            lastAutomaticMessage = undefined;
            scheduleInactivityTimer();
        }
    }
});
