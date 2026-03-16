type QueuedTask<T> = {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

class ScrapeQueue {
  private queue: QueuedTask<unknown>[] = [];
  private isProcessing = false;

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task: task as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const item = this.queue.shift()!;

    try {
      const result = await item.task();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }

  get pending(): number {
    return this.queue.length;
  }

  get busy(): boolean {
    return this.isProcessing;
  }
}

// Singleton queue instance - one scrape at a time
export const scrapeQueue = new ScrapeQueue();
