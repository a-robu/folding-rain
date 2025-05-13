export class ValueSet<T> {
    private map: Map<string, T>;
    private keyFn: (item: T) => string;

    constructor(keyFn: (item: T) => string) {
        this.map = new Map<string, T>();
        this.keyFn = keyFn;
    }

    add(item: T): void {
        const key = this.keyFn(item);
        this.map.set(key, item);
    }

    has(item: T): boolean {
        const key = this.keyFn(item);
        return this.map.has(key);
    }

    delete(item: T): boolean {
        const key = this.keyFn(item);
        return this.map.delete(key);
    }

    get(item: T): T | undefined {
        const key = this.keyFn(item);
        return this.map.get(key);
    }

    clear(): void {
        this.map.clear();
    }

    values(): IterableIterator<T> {
        return this.map.values();
    }

    size(): number {
        return this.map.size;
    }
}
