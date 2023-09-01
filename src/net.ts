import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import Express, { NextFunction, Request, Response, json } from "express";
import { config } from "./lib/config.js";
import { z } from "zod";
import { cache } from "./lib/cache.js";
import { calculateTopBids, handleEvent, isDonatorBanned } from "./index.js";
import { db } from "./lib/db.js";

const PORT = config.rest.port;
const app = Express();
const wss = new WebSocketServer({ noServer: true });
export const server = http.createServer(app);

const bidItemBody = z.object({
    id: z.number().int().positive().gte(1),
});

const donatorStatusBody = z.object({
    username: z.string(),
    banned: z.boolean(),
});

async function auth(req: Request, res: Response, next: NextFunction) {
    const key = req.headers.authorization?.slice("Bearer ".length);
    if (!key) {
        return res.status(400).send();
    }

    try {
        const rows = await db.pool.query(
            `SELECT * FROM ${config.db.database}.API_KEYS WHERE \`key\` = ?`,
            [key]
        );

        if (rows.length > 0) {
            return next();
        } else {
            return res.status(401).send();
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}

app.put("/bid_item", [auth, json()], (req: Request, res: Response) => {
    let id: number;
    try {
        id = bidItemBody.parse(req.body).id;
    } catch (err) {
        console.log(err);
        return res.status(400).send();
    }

    cache.set("currentBidItemId", id);
    broadcastBidItemId();
    console.log("update bid item id", id);

    return res.send();
});

app.get("/refresh_bids", auth, async (req: Request, res: Response) => {
    try {
        await broadcastBids();
        return res.send();
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});

app.put(
    "/donator/status",
    [auth, json()],
    async (req: Request, res: Response) => {
        let body: {
            username: string;
            banned: boolean;
        };
        try {
            body = donatorStatusBody.parse(req.body);
        } catch (err) {
            console.log(err);
            return res.status(400).send();
        }

        try {
            const isBanned = await isDonatorBanned(body.username);
            if (isBanned) {
                if (!body.banned) {
                    await db.pool.query(
                        `DELETE FROM ${config.db.database}.BANNED_USERS WHERE username = ?`,
                        [body.username]
                    );
                }
            } else {
                if (body.banned) {
                    await db.pool.query(
                        `INSERT INTO ${config.db.database}.BANNED_USERS (username) VALUES ( ? )`,
                        [body.username]
                    );
                }
            }
        } catch (err) {
            console.log(err);
            return res.status(500).send();
        }

        return res.send();
    }
);

app.post("/test", [auth, json()], async (req: Request, res: Response) => {
    await handleEvent(req.body);
    res.send();
});

wss.on("connection", (socket) => {
    socket.on("error", (err) => {
        console.log(err);
    });
});

server.on("upgrade", (request, socket, head) => {
    if (!request.url) return;

    const { pathname } = new URL(request.url, `http://${request.headers.host}`);
    if (pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    } else {
        socket.destroy();
    }
});

export function broadcast(message: object) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

export async function broadcastBids() {
    const bids: {
        [key: number]: {
            username: string;
            bid: number;
        }[];
    } = {};

    (await calculateTopBids()).forEach((v, k) => {
        bids[k] = v;
    });

    broadcast({
        type: "bids",
        data: bids,
    });
}

async function broadcastBidItemId() {
    broadcast({
        type: "bid_item",
        data: {
            id: cache.get("currentBidItemId"),
        },
    });
}

export function initNet() {
    setInterval(() => {
        broadcast({
            type: "ping",
        });
    }, 30_000);

    return new Promise<void>((res) => {
        server.listen(PORT, () => {
            console.log(`[REST] Listening on ${PORT} ...`);
            res();
        });
    });
}
