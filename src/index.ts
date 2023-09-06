import { getUserTips } from "./lib/se.js";
import dotenv from "dotenv";
import { config } from "./lib/config.js";
import { Bid, db } from "./lib/db.js";
import { bidsMessage, broadcast, initNet } from "./net.js";
import { cache, initCache } from "./lib/cache.js";
import { client, initIRC } from "./irc.js";
dotenv.config();

async function main() {
    await initCache();
    await initIRC();
    await initNet();

    client.on("PRIVMSG", (message) => {
        handleEvent(message.senderUsername.toLowerCase(), message.messageText);
    });
}

export async function handleEvent(username: string, message: string) {
    const args = message.split(" ");
    const command = args.shift();

    if (args.length < 1) return;
    if (command !== config.irc.command) return;
    if (!(await isValidDonator(username))) return;

    let amount = 0;
    try {
        amount = parseInt(args[0].startsWith("$") ? args[0].slice(1) : args[0]);
    } catch (err) {
        return;
    }

    console.log(username, command, amount);

    try {
        await insertBid(username, amount, cache.get("currentBidItemId"));

        broadcast(await bidsMessage());
    } catch (err) {
        console.log(err);
    }
}

async function isValidDonator(username: string) {
    if (await isDonatorBanned(username)) return false;

    if (cache.get(`valid_${username}`) === true) {
        return true;
    }

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

    cache.set(`valid_${username}`, true);
    return true;
}

export async function isDonatorBanned(username: string) {
    const rows: any[] = await db.pool.query(
        `SELECT * FROM ${config.db.database}.BANNED_USERS WHERE username = ?`,
        [username]
    );

    return rows.length > 0 ? true : false;
}

async function insertBid(username: string, amount: number, itemId: number) {
    const rows = await db.pool.query(`SELECT * FROM ${config.db.database}.DONATIONS WHERE item_id = ? AND username = ?`, [
        itemId,
        username
    ])

    const now = new Date();
    if (rows.length > 0) {
        if (rows[0].donation_amount >= amount) return;
        await db.pool.query(`UPDATE ${config.db.database}.DONATIONS SET donation_amount = ? WHERE item_id = ? AND username = ?`, [
            amount,
            itemId,
            username
        ])
    } else {
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
}

export async function calculateTopBids() {
    const rows: Bid[] = await db.pool.query(
        `SELECT * FROM ${config.db.database}.BIDS ORDER BY epoch`
    );

    const bids: Map<
        number,
        { username: string; bid: number; epoch: number }[]
    > = new Map();

    for (const row of rows) {
        const id = row.item_id;

        if (!bids.has(id)) {
            bids.set(id, []);
        }

        bids.get(id)?.push({
            username: row.username,
            bid: row.bid,
            epoch: row.epoch,
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

    console.log(bids);
    return bids;
}

main();
