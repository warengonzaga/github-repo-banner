/** Process-local TTL cache with bounded retained bytes and in-flight work. */
export class BoundedCache {
  private entries = new Map<
    string,
    { value: string; expires: number; bytes: number }
  >();
  private pending = new Map<string, Promise<string | null>>();
  private bytes = 0;

  constructor(
    private maxBytes: number,
    private ttlMs: number,
    private concurrency: number,
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
    if (this.pending.size >= this.concurrency) return null;
    const task = Promise.resolve()
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
      .finally(() => this.pending.delete(key));
    this.pending.set(key, task);
    return task;
  }
}
