import db from "mariadb";
import { config } from "./config.js";

export type Donation = {
    id: number;
    item_id: number;
    epoch: number;
    iso: string;
    donation_amount: number;
    username: string;
};

export type Bid = {
    username: string;
    item_id: number;
    bid: number;
};

class DB {
    pool;

    constructor() {
        this.pool = db.createPool({
            ...config.db,
        });
    }
}

const instance = new DB();

export { instance as db };
