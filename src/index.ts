import { getUserTips } from "./lib/se.js";
import dotenv from "dotenv";
import { io } from "socket.io-client";
import { config } from "./lib/config.js";
import { Bid, db } from "./lib/db.js";
import { broadcastBids, initNet } from "./net.js";
import { cache, initCache } from "./lib/cache.js";
dotenv.config();

async function main() {
    initCache();
    await initNet();
    const socket = io("https://realtime.streamelements.com", {
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("connect", socket.id);
        socket.emit("authenticate", {
            method: "jwt",
            token: process.env.TOKEN,
        });
    });

    socket.on("connect_error", (err: any) => {
        console.log("connect_error", err.context.responseText);
    });

    socket.on("disconnect", () => {
        console.log("disconnect", socket.id);
    });

    socket.on("authenticated", (data) => {
        console.log("authenticated", data);
    });

    socket.on("event", handleEvent);
}

export async function handleEvent(data: any) {
    if (data.type != "tip") return;
    console.log("event", data);
    const username: string = data.data.username.toLowerCase();

    if (!(await isValidDonator(username))) return;

    const amount: number = data.data.amount;

    try {
        await insertDonation(username, amount, cache.get("currentBidItemId"));

        await broadcastBids();
    } catch (err) {
        console.log(err);
    }
}

async function isValidDonator(username: string) {
    if (await isDonatorBanned(username)) return false;

    const tips = await getUserTips(username);
    if (!tips) return false;
    const totalDonated = tips.docs.reduce((prev, curr) => {
        if (
            curr.donation.user.username.toLowerCase() == username.toLowerCase()
        ) {
            return prev + curr.donation.amount;
        } else {
            return prev;
        }
    }, 0);
    if (totalDonated < config.minimumDonationAmount) return false;

    return true;
}

export async function isDonatorBanned(username: string) {
    const rows: any[] = await db.pool.query(
        `SELECT * FROM ${config.db.database}.BANNED_USERS WHERE username = ?`,
        [username]
    );

    return rows.length > 0 ? true : false;
}

async function insertDonation(
    username: string,
    amount: number,
    itemId: number
) {
    const now = new Date();
    await db.pool.query(
        `INSERT INTO ${config.db.database}.DONATIONS (username, item_id, epoch, iso, donation_amount) VALUES ( ?, ?, ?, ?, ? );`,
        [
            username,
            itemId,
            Math.floor(now.getTime() / 1000),
            now.toISOString(),
            amount,
        ]
    );
}

export async function calculateTopBids() {
    const rows: Bid[] = await db.pool.query(
        `SELECT * FROM ${config.db.database}.BIDS`
    );

    const bids: Map<number, { username: string; bid: number }[]> = new Map();

    for (const row of rows) {
        const id = row.item_id;

        if (!bids.has(id)) {
            bids.set(id, []);
        }

        bids.get(id)?.push({
            username: row.username,
            bid: row.bid,
        });
    }

    bids.forEach((v, k) => {
        bids.set(
            k,
            v.sort((a, b) => {
                return b.bid - a.bid;
            })
        );
    });

    return bids;
}

main();
