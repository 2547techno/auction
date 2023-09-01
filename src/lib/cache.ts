export const cache: Map<string, any> = new Map();

export function initCache() {
    cache.set("currentBidItemId", 1);
}
