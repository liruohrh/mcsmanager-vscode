import { logger } from "@/utils/log";
import { setUpTerminalStreamChannel } from "./instance";

export async function closeTerminal(socket: any) {
    socket.close();
}
export async function sendCommand(socket: any, command: string) {
    socket.emit("stream/input", {
        data: {
            command,
        },
    });
}

export interface UseTerminalParams {
    instanceId: string;
    daemonId: string;
    onMessage: (msg: string) => void;
}

function removeTrail(origin: string, trail: string) {
    if (origin.endsWith(trail)) {
        return origin.slice(0, origin.length - trail.length);
    } else {
        return origin;
    }
}

export const TERM_COLOR = {
    TERM_RESET: "\x1B[0m",
    TERM_TEXT_BLACK: "\x1B[0;30m", // Black §0
    TERM_TEXT_DARK_BLUE: "\x1B[0;34m", // Dark Blue §1
    TERM_TEXT_DARK_GREEN: "\x1B[0;32m", // Dark Green §2
    TERM_TEXT_DARK_AQUA: "\x1B[0;36m", // Dark Aqua §3
    TERM_TEXT_DARK_RED: "\x1B[0;31m", // Dark Red §4
    TERM_TEXT_DARK_PURPLE: "\x1B[0;35m", // Dark Purple §5
    TERM_TEXT_GOLD: "\x1B[0;33m", // Gold §6
    TERM_TEXT_GRAY: "\x1B[0;37m", // Gray §7
    TERM_TEXT_DARK_GRAY: "\x1B[0;30;1m", // Dark Gray §8
    TERM_TEXT_BLUE: "\x1B[0;34;1m", // Blue §9
    TERM_TEXT_GREEN: "\x1B[0;32;1m", // Green §a
    TERM_TEXT_AQUA: "\x1B[0;36;1m", // Aqua §b
    TERM_TEXT_RED: "\x1B[0;31;1m", // Red §c
    TERM_TEXT_LIGHT_PURPLE: "\x1B[0;35;1m", // Light Purple §d
    TERM_TEXT_YELLOW: "\x1B[0;33;1m", // Yellow §e
    TERM_TEXT_WHITE: "\x1B[0;37;1m", // White §f
    TERM_TEXT_OBFUSCATED: "\x1B[5m", // Obfuscated §k
    TERM_TEXT_BOLD: "\x1B[21m", // Bold §l
    TERM_TEXT_STRIKETHROUGH: "\x1B[9m", // Strikethrough §m
    TERM_TEXT_UNDERLINE: "\x1B[4m", // Underline §n
    TERM_TEXT_ITALIC: "\x1B[3m", // Italic §o
    TERM_TEXT_B: "\x1B[1m",
};
export function encodeConsoleColor(text: string) {
    text = text.replace(/(\x1B[^m]*m)/gm, "$1;");
    text = text.replace(/ \[([A-Za-z0-9 _\-\\.]+)]/gim, " [§3$1§r]");
    text = text.replace(/^\[([A-Za-z0-9 _\-\\.]+)]/gim, "[§3$1§r]");
    text = text.replace(/((["'])(.*?)\1)/gm, "§e$1§r");
    text = text.replace(/([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})/gim, "§6$1§r");
    text = text.replace(
        /([0-9]{2,4}[\/\-][0-9]{2,4}[\/\-][0-9]{2,4})/gim,
        "§6$1§r"
    );
    text = text.replace(/(\x1B[^m]*m);/gm, "$1");
    // ["](.*?)["];
    text = text.replace(/§0/gim, TERM_COLOR.TERM_TEXT_BLACK);
    text = text.replace(/§1/gim, TERM_COLOR.TERM_TEXT_DARK_BLUE);
    text = text.replace(/§2/gim, TERM_COLOR.TERM_TEXT_DARK_GREEN);
    text = text.replace(/§3/gim, TERM_COLOR.TERM_TEXT_DARK_AQUA);
    text = text.replace(/§4/gim, TERM_COLOR.TERM_TEXT_DARK_RED);
    text = text.replace(/§5/gim, TERM_COLOR.TERM_TEXT_DARK_PURPLE);
    text = text.replace(/§6/gim, TERM_COLOR.TERM_TEXT_GOLD);
    text = text.replace(/§7/gim, TERM_COLOR.TERM_TEXT_GRAY);
    text = text.replace(/§8/gim, TERM_COLOR.TERM_TEXT_DARK_GRAY);
    text = text.replace(/§9/gim, TERM_COLOR.TERM_TEXT_BLUE);
    text = text.replace(/§a/gim, TERM_COLOR.TERM_TEXT_GREEN);
    text = text.replace(/§b/gim, TERM_COLOR.TERM_TEXT_AQUA);
    text = text.replace(/§c/gim, TERM_COLOR.TERM_TEXT_RED);
    text = text.replace(/§d/gim, TERM_COLOR.TERM_TEXT_LIGHT_PURPLE);
    text = text.replace(/§e/gim, TERM_COLOR.TERM_TEXT_YELLOW);
    text = text.replace(/§f/gim, TERM_COLOR.TERM_TEXT_WHITE);
    text = text.replace(/§k/gim, TERM_COLOR.TERM_TEXT_OBFUSCATED);
    text = text.replace(/§l/gim, TERM_COLOR.TERM_TEXT_BOLD);
    text = text.replace(/§m/gim, TERM_COLOR.TERM_TEXT_STRIKETHROUGH);
    text = text.replace(/§n/gim, TERM_COLOR.TERM_TEXT_UNDERLINE);
    text = text.replace(/§o/gim, TERM_COLOR.TERM_TEXT_ITALIC);
    text = text.replace(/§r/gim, TERM_COLOR.TERM_RESET);

    text = text.replace(/&0/gim, TERM_COLOR.TERM_TEXT_BLACK);
    text = text.replace(/&1/gim, TERM_COLOR.TERM_TEXT_DARK_BLUE);
    text = text.replace(/&2/gim, TERM_COLOR.TERM_TEXT_DARK_GREEN);
    text = text.replace(/&3/gim, TERM_COLOR.TERM_TEXT_DARK_AQUA);
    text = text.replace(/&4/gim, TERM_COLOR.TERM_TEXT_DARK_RED);
    text = text.replace(/&5/gim, TERM_COLOR.TERM_TEXT_DARK_PURPLE);
    text = text.replace(/&6/gim, TERM_COLOR.TERM_TEXT_GOLD);
    text = text.replace(/&7/gim, TERM_COLOR.TERM_TEXT_GRAY);
    text = text.replace(/&8/gim, TERM_COLOR.TERM_TEXT_DARK_GRAY);
    text = text.replace(/&9/gim, TERM_COLOR.TERM_TEXT_BLUE);
    text = text.replace(/&a/gim, TERM_COLOR.TERM_TEXT_GREEN);
    text = text.replace(/&b/gim, TERM_COLOR.TERM_TEXT_AQUA);
    text = text.replace(/&c/gim, TERM_COLOR.TERM_TEXT_RED);
    text = text.replace(/&d/gim, TERM_COLOR.TERM_TEXT_LIGHT_PURPLE);
    text = text.replace(/&e/gim, TERM_COLOR.TERM_TEXT_YELLOW);
    text = text.replace(/&f/gim, TERM_COLOR.TERM_TEXT_WHITE);
    text = text.replace(/&k/gim, TERM_COLOR.TERM_TEXT_OBFUSCATED);
    text = text.replace(/&l/gim, TERM_COLOR.TERM_TEXT_BOLD);
    text = text.replace(/&m/gim, TERM_COLOR.TERM_TEXT_STRIKETHROUGH);
    text = text.replace(/&n/gim, TERM_COLOR.TERM_TEXT_UNDERLINE);
    text = text.replace(/&o/gim, TERM_COLOR.TERM_TEXT_ITALIC);
    text = text.replace(/&r/gim, TERM_COLOR.TERM_RESET);

    const RegExpStringArr = [
        //blue
        ["\\d{1,3}%", "true", "false"],
        //green
        [
            "information",
            "info",
            "\\(",
            "\\)",
            "\\{",
            "\\}",
            '\\"',
            "&lt;",
            "&gt;",
            "-->",
            "->",
            ">>>",
        ],
        //red
        ["Error", "Caused by", "panic"],
        //yellow
        ["WARNING", "Warn"],
    ];
    for (const k in RegExpStringArr) {
        for (const y in RegExpStringArr[k]) {
            const reg = new RegExp(
                "(" + RegExpStringArr[k][y].replace(/ /gim, "&nbsp;") + ")",
                "igm"
            );
            if (k === "0") {
                //blue
                text = text.replace(
                    reg,
                    TERM_COLOR.TERM_TEXT_BLUE + "$1" + TERM_COLOR.TERM_RESET
                );
            } else if (k === "1") {
                //green
                text = text.replace(
                    reg,
                    TERM_COLOR.TERM_TEXT_DARK_GREEN +
                        "$1" +
                        TERM_COLOR.TERM_RESET
                );
            } else if (k === "2") {
                //red
                text = text.replace(
                    reg,
                    TERM_COLOR.TERM_TEXT_RED + "$1" + TERM_COLOR.TERM_RESET
                );
            } else if (k === "3") {
                //yellow
                text = text.replace(
                    reg,
                    TERM_COLOR.TERM_TEXT_GOLD + "$1" + TERM_COLOR.TERM_RESET
                );
            }
        }
    }
    // line ending symbol substitution
    text = text.replace(/\r\n/gm, TERM_COLOR.TERM_RESET + "\r\n");
    return text;
}

export const executeSocket = async (config: UseTerminalParams) => {
    const { io } = await import("socket.io-client");
    const res = await setUpTerminalStreamChannel({
        daemonId: config.daemonId,
        uuid: config.instanceId,
    });
    if (res.base.code !== 0) {
        throw new Error(
            `can not set up a Stream Channel, ${JSON.stringify(res.base)}`
        );
    }
    const remoteInfo = res.base.data!;
    const addr =
        remoteInfo.addr.includes("ws://") || remoteInfo.addr.includes("wss://")
            ? remoteInfo.addr
            : `ws://${remoteInfo.addr}`;
    const password = remoteInfo.password;
    const socketIoPath =
        (!!remoteInfo.prefix ? removeTrail(remoteInfo.prefix, "/") : "") +
        "/socket.io";
    logger.info2(
        `remoteInfo: `,
        JSON.stringify(remoteInfo),
        `socketIoPath=${socketIoPath}`
    );
    const socket = io(addr, {
        path: socketIoPath,
        multiplex: false,
        reconnectionDelayMax: 1000 * 10,
        timeout: 1000 * 30,
        reconnection: true,
        reconnectionAttempts: 3,
        rejectUnauthorized: false,
    });

    socket.on("connect", () => {
        logger.info2("[Socket.io] connect:", addr);
        socket?.emit("stream/auth", {
            data: { password },
        });
    });

    socket.on("connect_error", (error) => {
        logger.error("[Socket.io] Connect error: ", addr, error);
    });

    socket.on("instance/stopped", () => {
        logger.info2("instance/stopped");
    });

    socket.on("instance/opened", () => {
        logger.info2("instance/opened");
    });

    socket.on("stream/auth", (packet) => {
        const data = packet.data;
        if (data === true) {
            socket?.emit("stream/detail", {});
        } else {
            logger.error("Stream/auth error!");
        }
    });

    socket.on("reconnect", () => {
        logger.info2("[Socket.io] reconnect:", addr);
        socket?.emit("stream/auth", {
            data: { password },
        });
    });

    socket.on("disconnect", () => {
        logger.info2("[Socket.io] disconnect:", addr);
    });

    socket.on("instance/stdout", (packet) => {
        const message = encodeConsoleColor(packet.data.text);
        config.onMessage(message);
    });
    socket.on("stream/detail", (packet) => {
        logger.info2("stream/detail", packet?.data);
    });

    socket.connect();
    return socket;
};
