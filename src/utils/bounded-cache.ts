/** Process-local TTL cache with bounded retained bytes and in-flight work. */
export class BoundedCache {
  private entries = new Map<
    string,
    { value: string; expires: number; bytes: number }
  >();
  private pending = new Map<string, Promise<string | null>>();
  private active = 0;
  private queue: Array<() => void> = [];
  private bytes = 0;

  constructor(
    private maxBytes: number,
    private ttlMs: number,
    private concurrency: number,
    private maxQueued = 0,
  ) {}

  async get(
    key: string,
    load: () => Promise<string | null>,
  ): Promise<string | null> {
    const now = Date.now();
    for (const [id, entry] of this.entries) {
      if (entry.expires <= now) {
        this.entries.delete(id);
        this.bytes -= entry.bytes;
      }
    }
    const cached = this.entries.get(key);
    if (cached) return cached.value;
    const pending = this.pending.get(key);
    if (pending) return pending;
    if (this.pending.size >= this.concurrency + this.maxQueued) return null;
    const task = Promise.resolve()
      .then(async () => {
        if (this.active >= this.concurrency) {
          await new Promise<void>((resolve) => this.queue.push(resolve));
        } else {
          this.active++;
        }
      })
      .then(load)
      .then((value) => {
        if (value === null) return null;
        // Account conservatively for UTF-16 strings, including their keys.
        const bytes = 2 * (key.length + value.length);
        if (bytes > this.maxBytes) return value;
        for (const [id, entry] of this.entries) {
          if (this.bytes + bytes <= this.maxBytes) break;
          this.entries.delete(id);
          this.bytes -= entry.bytes;
        }
        this.entries.set(key, {
          value,
          bytes,
          expires: Date.now() + this.ttlMs,
        });
        this.bytes += bytes;
        return value;
      })
      .finally(() => {
        this.pending.delete(key);
        const next = this.queue.shift();
        // Transfer the reserved slot directly so newcomers cannot overtake a waiter.
        if (next) next();
        else this.active--;
      });
    this.pending.set(key, task);
    return task;
  }
}
