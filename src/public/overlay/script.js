const url = new URL("/ws", window.location);
url.protocol = "ws";

const ws = new WebSocket(url);
