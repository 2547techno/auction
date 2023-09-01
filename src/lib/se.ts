// https://api.streamelements.com/kappa/v2/tips/{channel}

type TipResponse = {
    docs: Tip[];
    total: number;
    limit: number;
    offset: number;
};

type Tip = {
    _id: string;
    channel: string;
    provider: string;
    status: string;
    deleted: boolean;
    transactionId: string;
    createdAt: string;
    approved: string;
    updatedAt: string;
    donation: {
        user: {
            username: string;
            ip: string | null;
            geo: string | null;
            email: string;
        };
        message: string;
        amount: number;
        currency: string;
    };
};

// mizkif: 5b8e237fdd2dae1538999cd4
export async function getUserTips(username: string) {
    const url = new URL(
        `kappa/v2/tips/5b8e237fdd2dae1538999cd4?username=${encodeURIComponent(
            username
        )}`,
        "https://api.streamelements.com"
    );
    console.log("fetch", url.href);
    const res = await fetch(url, {
        headers: {
            authorization: `Bearer ${process.env.TOKEN}`,
        },
    });

    if (!res.ok) {
        console.log("getUserTips", res.status);
        return;
    }

    const json: TipResponse = await res.json();

    return json;
}
