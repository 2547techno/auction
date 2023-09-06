let bidItem = {
    id: 0,
    name: "",
};
let bids = {};

const url = new URL("/ws", window.location);
url.protocol = url.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(url);

ws.addEventListener("message", (event) => {
    if (!event.data) return;
    const message = JSON.parse(event.data);
    console.log(message);

    switch (message.type) {
        case "bid_item": {
            bidItem = message.data;
            refreshBidItem();
            refreshBids();
            break;
        }
        case "bids": {
            bids = message.data;
            refreshBids();
            break;
        }
    }
});

function refreshBidItem() {
    document.getElementById("bid-item-name").innerText = bidItem.name;
}

function refreshBids() {
    const outter = document.createElement("div");
    outter.className = "outter";
    for (const [i, bid] of (bids[bidItem.id] ?? []).slice(0, 10).entries()) {
        const div = document.createElement("div");
        div.className = "inner";
        div.innerText = `$${bid.bid} ${bid.username}`;
        div.style = `font-size: ${80 - i * 6}px`;
        outter.appendChild(div);
    }

    document.getElementById("bids").replaceChildren(outter);
}
