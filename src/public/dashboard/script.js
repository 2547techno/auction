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
}

function key() {
    return document.getElementById("api-key-input").value ?? "";
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

bindEvents();
loadApiKey();
