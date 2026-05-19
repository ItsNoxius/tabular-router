/** Clone data for closed-tab storage (avoids Solid store proxies / non-cloneable values). */
export function cloneForStorage<T>(value: T): T {
    if (value === null || typeof value !== "object") {
        return value;
    }
    try {
        return structuredClone(value);
    } catch {
        return JSON.parse(JSON.stringify(value)) as T;
    }
}
