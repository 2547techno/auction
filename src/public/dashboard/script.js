const domain = new URL(window.location);

function bindEvents() {
    document.getElementById("save-key").addEventListener("click", () => {
        saveApiKey();
    });
    document.getElementById("clear-key").addEventListener("click", () => {
        clearApiKey();
    });
    document.getElementById("toggle-hidden").addEventListener("click", () => {
        const input = document.getElementById("api-key-input");
        if (input.type === "password") {
            input.type = "text";
            document.getElementById("toggle-hidden").innerText = "Hide Key";
        } else {
            input.type = "password";
            document.getElementById("toggle-hidden").innerText = "Show Key";
        }
    });
    document.getElementById("ban-user-button").addEventListener("click", () => {
        updateUserStatus(
            document.getElementById("ban-unban-user-input").value,
            true
        );
    });
    document
        .getElementById("unban-user-button")
        .addEventListener("click", () => {
            updateUserStatus(
                document.getElementById("ban-unban-user-input").value,
                false
            );
        });
    document
        .getElementById("update-overlay-button")
        .addEventListener("click", () => {
            forceUpdateOverlay();
        });
    document
        .getElementById("update-bid-item-button")
        .addEventListener("click", () => {
            const dropdown = document.getElementById("bid-items-dropdown");
            if (dropdown.value === "none") return;

            updateBidItem(parseInt(dropdown.value));
        });
}

function key() {
    return document.getElementById("api-key-input").value ?? "";
}

function connectToWS() {
    const url = new URL("/ws", domain);
    url.protocol = "ws";
    const ws = new WebSocket(url);

    ws.addEventListener("message", (event) => {
        if (!event.data) return;
        const message = JSON.parse(event.data);

        if (message.type === "bid_item") {
            updateBidItemDOM(message.data.id, message.data.name);
        }
    });
}

async function getBidItems() {
    const res = await fetch(new URL("/bid_items", domain), {
        method: "GET",
        headers: {
            authorization: `Bearer ${key()}`,
        },
    });

    const items = await res.json();
    for (const item of items) {
        const option = document.createElement("option");
        option.value = item.id;
        option.innerText = item.name;
        document.getElementById("bid-items-dropdown").appendChild(option);
    }
}

function loadApiKey() {
    const key = Cookies.get("api-key") ?? "";
    document.getElementById("api-key-input").value = key;
}

function saveApiKey() {
    const input = document.getElementById("api-key-input");
    Cookies.set("api-key", input.value);
}

function clearApiKey() {
    Cookies.remove("api-key");
    document.getElementById("api-key-input").value = "";
}

async function updateUserStatus(username, banStatus) {
    const res = await fetch(new URL("/donator/status", domain), {
        method: "PUT",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${key()}`,
        },
        body: JSON.stringify({
            username: username.toLowerCase(),
            banned: banStatus,
        }),
    });

    return res.status;
}

async function forceUpdateOverlay() {
    const res = await fetch(new URL("/refresh_bids", domain), {
        method: "GET",
        headers: {
            authorization: `Bearer ${key()}`,
        },
    });

    return res.status;
}

function updateBidItemDOM(id, name) {
    document.getElementById(
        "current-bid-item"
    ).innerText = `Current bid item: (${id}) "${name}"`;
}

async function updateBidItem(id) {
    const res = await fetch(new URL("/bid_item", domain), {
        method: "PUT",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${key()}`,
        },
        body: JSON.stringify({
            id,
        }),
    });

    return res.status;
}

loadApiKey();
getBidItems();
connectToWS();
bindEvents();
