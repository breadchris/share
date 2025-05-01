export class ContentService {
    private ws: WebSocket | null = null;
    private url: string | null = null;

    constructor(url: string) {
        this.url = url;
    }

    public close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    async *infer(params: { prompt: string }, options: { timeoutMs?: number, signal: AbortSignal }): AsyncGenerator<string, void, unknown> {
        const { signal } = options;
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(this.url);

        signal.addEventListener("abort", () => {
            if (this.ws) {
                this.ws.close();
            }
        });

        const messageQueue: string[] = [];
        let done = false;
        let error: Error | null = null;

        this.ws.onmessage = (event) => {
            messageQueue.push(event.data);
        };

        this.ws.onerror = (err) => {
            error = new Error(`WebSocket error: ${err}`);
            done = true;
        };

        this.ws.onclose = () => {
            done = true;
        };

        this.ws.onopen = () => {
            const requestPayload = JSON.stringify(params);
            this.ws?.send(requestPayload);
        };

        try {
            while (!done || messageQueue.length > 0) {
                if (messageQueue.length > 0) {
                    yield messageQueue.shift()!;
                } else {
                    // Wait for the next message or a close/error event
                    await new Promise((resolve) => {
                        const interval = setInterval(() => {
                            if (done || messageQueue.length > 0) {
                                clearInterval(interval);
                                resolve(null);
                            }
                        }, 100);
                    });
                }

                if (error) {
                    throw error;
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                return;
            }
            throw err;
        } finally {
            if (this.ws) {
                this.ws.close();
            }
        }
    }
}

export const contentService = new ContentService("ws://localhost:8080/llm/stream");
