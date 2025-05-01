import { DocumentManager } from "@y-sweet/sdk";

const manager = new DocumentManager(
    process.env.CONNECTION_STRING || "ys://127.0.0.1:8080",
);

const argv1 = process.argv[2];

(async () => {
    try {
        const d = await manager.getOrCreateDocAndToken(argv1);
        console.log(JSON.stringify(d, null, 2));
    } catch (e) {
        console.error(JSON.stringify({
            error: e,
        }, null, 2));
        process.exit(1);
    }
})()
