import { DocumentManager } from "@y-sweet/sdk";

const manager = new DocumentManager(
    process.env.CONNECTION_STRING || "ys://127.0.0.1:8080",
);

(async () => {
    const d = await manager.getOrCreateDocAndToken("my-doc-id");
    console.log(JSON.stringify(d, null, 2));
})()
