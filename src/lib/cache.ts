import { config } from "./config.js";
import { db } from "./db.js";

export const cache: Map<string, any> = new Map();

export async function initCache() {
    cache.set("currentBidItemId", 1);

    const rows = await db.pool.query(
        `SELECT * FROM ${config.db.database}.ITEMS`
    );
    const items: {
        [id: number]: string;
    } = {};
    for (const row of rows) {
        items[row.id] = row.name;
    }
    cache.set("bidItems", items);
}
