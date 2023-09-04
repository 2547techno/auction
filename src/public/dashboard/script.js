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
}

function loadApiKey() {
    console.log(document.cookie);
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

bindEvents();
loadApiKey();
