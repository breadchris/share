import * as monaco from 'monaco-editor'

export class LeapMonacoBinding {
    private editorInstance: monaco.editor.IStandaloneCodeEditor;
    private leapClient: any;
    private documentId: string;
    private content: string;
    private ready: boolean;

    constructor(
        leapClient: any,
        editorInstance: monaco.editor.IStandaloneCodeEditor,
        documentId: string
    ) {
        this.editorInstance = editorInstance;
        this.leapClient = leapClient;
        this.documentId = documentId;
        this.content = "";
        this.ready = false;

        // Bind event listeners
        this.editorInstance.onDidChangeModelContent(() => {
            this.triggerDiff();
        });

        // Listen for subscribe event from leapClient
        this.leapClient.on("subscribe", (body: any) => {
            if (body.document.id === this.documentId) {
                this.content = body.document.content;
                this.ready = true;
                this.editorInstance.setValue(this.content);
            }
        });

        // Listen for OT transforms from leapClient
        this.leapClient.on("transforms", (body: any) => {
            if (body.document.id === this.documentId) {
                const transforms = body.transforms;
                transforms.forEach((transform: any) => this.applyTransform(transform));
            }
        });

        // Listen for unsubscribe event
        this.leapClient.on("unsubscribe", (body: any) => {
            if (body.document.id === this.documentId) {
                // Unsubscribe logic here
            }
        });
    }

    // Apply a transform received from the server
    private applyTransform(transform: any) {
        const currentContent = this.editorInstance.getValue();
        const cursorPos = this.editorInstance.getPosition();

        const newContent = this.leapClient.apply(transform, currentContent);
        this.content = newContent;
        this.editorInstance.setValue(newContent);

        if (cursorPos) {
            this.editorInstance.setPosition(cursorPos);
        }
    }

    // Detect changes in the Monaco editor and send a transform to the server
    private triggerDiff() {
        const newContent = this.editorInstance.getValue();
        if (!this.ready || newContent === this.content) {
            return;
        }

        // Calculate the difference (transform)
        const i = this.diffStart(this.content, newContent);
        const j = this.diffEnd(i, this.content, newContent);

        const transform = {
            position: i,
            // num_delete: this.content.length - j,
            // insert: newContent.slice(i, j),
        };
        if (this.content.length !== i + j) {
            transform["num_delete"] = this.content.length - (i + j);
        }
        if (newContent.length !== i + j) {
            transform["insert"] = newContent.slice(i, newContent.length - j);
        }

        this.content = newContent;

        if (transform["insert"] !== undefined || transform["num_delete"] !== undefined) {
            this.leapClient.send_transform(this.documentId, transform);
        }
    }

    // Utility to find the start of the difference
    private diffStart(oldContent: string, newContent: string): number {
        let i = 0;
        while (oldContent[i] === newContent[i] && i < oldContent.length && i < newContent.length) {
            i++;
        }
        return i;
    }

    // Utility to find the end of the difference
    private diffEnd(start: number, oldContent: string, newContent: string): number {
        let j = 0;

        while ((newContent[(newContent.length - 1 - j)] ===
            oldContent[(oldContent.length - 1 - j)]) &&
        ((start + j) < newContent.length) && ((start + j) < oldContent.length)) {
            j++;
        }
        return j;
    }
}
