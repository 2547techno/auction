let bidItem = {
    id: 0,
    name: "",
};
let bids = {};

const url = new URL("/ws", window.location);
url.protocol = "ws";
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
    const ol = document.createElement("ol");
    for (const bid of bids[bidItem.id] ?? []) {
        const li = document.createElement("li");
        li.innerText = `$${bid.bid} ${bid.username}`;
        ol.appendChild(li);
    }

    document.getElementById("bids").replaceChildren(ol);
}
