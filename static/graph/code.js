// node_modules/@y-sweet/sdk/dist/main.mjs
var YSweetError = class _YSweetError extends Error {
  /**
   * Create a new {@link YSweetError}.
   *
   * @param cause An object representing metadata associated with the error.
   * @see {@link YSweetErrorPayload}
   */
  constructor(cause) {
    super(_YSweetError.getMessage(cause));
    this.cause = cause;
    this.name = "YSweetError";
  }
  /** Convert the message to an error string that can be displayed to the user.
   *
   * The error string can also be used with {@link YSweetError.fromMessage} to
   * reconstruct the payload object, which is useful in the context of Next.js,
   * which will only pass an error string from the server to the client.
   *
   * @param payload The payload object to convert to a string.
   * @returns A string representation of the error.
   */
  static getMessage(payload) {
    let message;
    if (payload.code === "ServerRefused") {
      message = `Server at ${payload.address}:${payload.port} refused connection. URL: ${payload.url}`;
    } else if (payload.code === "ServerError") {
      message = `Server responded with ${payload.status} ${payload.message}. URL: ${payload.url}`;
    } else if (payload.code === "NoAuthProvided") {
      message = "No auth provided";
    } else if (payload.code === "InvalidAuthProvided") {
      message = "Invalid auth provided";
    } else {
      message = payload.message;
    }
    return `${payload.code}: ${message}`;
  }
  /**
   * In development, next.js passes error objects to the client but strips out everything but the
   * `message` field. This method allows us to reconstruct the original error object.
   *
   * @param messageString The error message string to reconstruct a payload from.
   * @returns A {@link YSweetError} object.
   * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/error#errormessage| Next.js docs}
   */
  static fromMessage(messageString) {
    let match = messageString.match(/^(.*?): (.*)$/);
    if (!match) {
      return new _YSweetError({ code: "Unknown", message: messageString });
    }
    let [, code, message] = match;
    if (code === "ServerRefused") {
      match = message.match(/^Server at (.*?):(\d+) refused connection. URL: (.*)$/);
      if (!match) {
        return new _YSweetError({ code: "Unknown", message: messageString });
      }
      let [, address, port, url] = match;
      return new _YSweetError({ code, address, port: parseInt(port), url });
    }
    if (code === "ServerError") {
      match = message.match(/^Server responded with (\d+) (.*). URL: (.*)$/);
      if (!match) {
        return new _YSweetError({ code: "Unknown", message: messageString });
      }
      let [, status, statusText, url] = match;
      return new _YSweetError({ code, status: parseInt(status), message: statusText, url });
    }
    if (code === "NoAuthProvided") {
      return new _YSweetError({ code });
    }
    if (code === "InvalidAuthProvided") {
      return new _YSweetError({ code });
    }
    return new _YSweetError({ code: "Unknown", message });
  }
};
var HttpClient = class {
  constructor(baseUrl, token) {
    this.token = null;
    this.baseUrl = baseUrl;
    this.token = token;
  }
  async request(path, method, body) {
    const headers = new Headers();
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }
    let rawBody;
    if (body instanceof Uint8Array) {
      headers.set("Content-Type", "application/octet-stream");
      rawBody = body;
    } else if (body) {
      headers.set("Content-Type", "application/json");
      rawBody = JSON.stringify(body);
    }
    const cacheBust = generateRandomString();
    let url = `${this.baseUrl}/${path}?z=${cacheBust}`;
    let result;
    try {
      result = await fetch(url, {
        method,
        body: rawBody,
        headers
      });
    } catch (error) {
      if (error.cause?.code === "ECONNREFUSED") {
        let { address, port } = error.cause;
        throw new YSweetError({ code: "ServerRefused", address, port, url });
      } else {
        throw new YSweetError({ code: "Unknown", message: error.toString() });
      }
    }
    if (!result.ok) {
      if (result.status === 401) {
        if (this.token) {
          throw new YSweetError({ code: "InvalidAuthProvided" });
        } else {
          throw new YSweetError({ code: "NoAuthProvided" });
        }
      }
      throw new YSweetError({
        code: "ServerError",
        status: result.status,
        message: result.statusText,
        url
      });
    }
    return result;
  }
};
function generateRandomString() {
  return Math.random().toString(36).substring(2);
}
var DocConnection = class {
  constructor(clientToken) {
    let baseUrl = clientToken.baseUrl.replace(/\/$/, "");
    this.client = new HttpClient(baseUrl, clientToken.token ?? null);
    this.docId = clientToken.docId;
  }
  /**
   * Returns an entire document, represented as a Yjs update byte string.
   *
   * This can be turned back into a Yjs document as follows:
   *
   * ```typescript
   * import * as Y from 'yjs'
   *
   * let update = await manager.getDocAsUpdate(docId)
   * let doc = new Y.Doc()
   * doc.transact(() => {
   *  Y.applyUpdate(doc, update)
   * })
   * ```
   *
   * @returns
   */
  async getAsUpdate() {
    const result = await this.client.request(`as-update`, "GET");
    if (!result.ok) {
      throw new Error(`Failed to get doc ${this.docId}: ${result.status} ${result.statusText}`);
    }
    let buffer = await result.arrayBuffer();
    return new Uint8Array(buffer);
  }
  /**
   * Updates a document with the given Yjs update byte string.
   *
   * This can be generated from a Yjs document as follows:
   *
   * ```typescript
   * import * as Y from 'yjs'
   *
   * let doc = new Y.Doc()
   * // Modify the document...
   * let update = Y.encodeStateAsUpdate(doc)
   * await manager.updateDoc(docId, update)
   * ```
   *
   * @param update
   */
  async updateDoc(update) {
    const result = await this.client.request(`update`, "POST", update);
    if (!result.ok) {
      throw new Error(`Failed to update doc ${this.docId}: ${result.status} ${result.statusText}`);
    }
  }
};
var DocumentManager = class {
  /**
   * Create a new {@link DocumentManager}.
   *
   * @param serverToken A connection string (starting with `ys://` or `yss://`) referring to a y-sweet server.
   */
  constructor(connectionString) {
    const parsedUrl = new URL(connectionString);
    let token = null;
    if (parsedUrl.username) {
      token = decodeURIComponent(parsedUrl.username);
    }
    let protocol = parsedUrl.protocol;
    if (protocol === "ys:") {
      protocol = "http:";
    } else if (protocol === "yss:") {
      protocol = "https:";
    }
    const url = `${protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
    let baseUrl = url.replace(/\/$/, "");
    this.client = new HttpClient(baseUrl, token);
  }
  async checkStore() {
    return await (await this.client.request("check_store", "POST", {})).json();
  }
  /**
   * Creates a new document on the y-sweet server given an optional docId. If a document with given
   * ID already exists, this is a no-op.
   *
   * @param docId The ID of the document to be created. If not provided, a random ID will be generated.
   * @returns A {@link DocCreationResult} object containing the ID of the created document.
   */
  async createDoc(docId) {
    const body = docId ? { docId } : {};
    const result = await this.client.request("doc/new", "POST", body);
    if (!result.ok) {
      throw new Error(`Failed to create doc: ${result.status} ${result.statusText}`);
    }
    const responseBody = await result.json();
    return responseBody;
  }
  /**
   * Get a client token for the given document.
   *
   * If you are using authorization, this is expected to be called from your server
   * after a user has authenticated. The returned token should then be passed to the
   * client.
   *
   * @param docId The ID of the document to get a token for.
   * @param authDocRequest An optional {@link AuthDocRequest} providing options for the token request.
   * @returns A {@link ClientToken} object containing the URL and token needed to connect to the document.
   */
  async getClientToken(docId, authDocRequest) {
    if (typeof docId !== "string") {
      docId = docId.docId;
    }
    const result = await this.client.request(`doc/${docId}/auth`, "POST", authDocRequest ?? {});
    if (!result.ok) {
      throw new Error(`Failed to auth doc ${docId}: ${result.status} ${result.statusText}`);
    }
    const responseBody = await result.json();
    return responseBody;
  }
  /**
   * A convenience wrapper around {@link DocumentManager.createDoc} and {@link DocumentManager.getClientToken} for
   * getting a client token for a document. If a docId is provided, ensures that a document exists with that ID or
   * that one is created. If no docId is provided, a new document is created with a random ID.
   *
   * @param docId The ID of the document to get or create. If not provided, a new document with a random ID will be created.
   * @param authDocRequest An optional {@link AuthDocRequest} providing options for the token request.
   * @returns A {@link ClientToken} object containing the URL and token needed to connect to the document.
   */
  async getOrCreateDocAndToken(docId, authDocRequest) {
    const result = await this.createDoc(docId);
    return await this.getClientToken(result, authDocRequest);
  }
  /**
   * Returns an entire document, represented as a Yjs update byte string.
   *
   * @param docId The ID of the document to get.
   * @returns The document as a Yjs update byte string
   */
  async getDocAsUpdate(docId) {
    const connection = await this.getDocConnection(docId);
    return await connection.getAsUpdate();
  }
  /**
   * Updates a document with the given Yjs update byte string.
   *
   * @param docId The ID of the document to update.
   * @param update The Yjs update byte string to apply to the document.
   */
  async updateDoc(docId, update) {
    const connection = await this.getDocConnection(docId);
    return await connection.updateDoc(update);
  }
  async getDocConnection(docId, authDocRequest) {
    const clientToken = await this.getClientToken(docId, authDocRequest);
    return new DocConnection(clientToken);
  }
  /**
   * Creates a new document with initial content.
   *
   * @param update A Yjs update byte string representing the initial content.
   * @returns A {@link DocCreationResult} object containing the ID of the created document.
   */
  async createDocWithContent(update) {
    const result = await this.createDoc();
    await this.updateDoc(result.docId, update);
    return result;
  }
};

// graph/code.ts
var manager = new DocumentManager(
  process.env.CONNECTION_STRING || "ys://127.0.0.1:8080"
);
var argv1 = process.argv[2];
(async () => {
  try {
    const d = await manager.getOrCreateDocAndToken(argv1);
    console.log(JSON.stringify(d, null, 2));
  } catch (e) {
    console.error(JSON.stringify({
      error: e
    }, null, 2));
    process.exit(1);
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL0B5LXN3ZWV0L3Nkay9zcmMvZXJyb3IudHMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL0B5LXN3ZWV0L3Nkay9zcmMvaHR0cC50cyIsICIuLi8uLi9ub2RlX21vZHVsZXMvQHktc3dlZXQvc2RrL3NyYy9jb25uZWN0aW9uLnRzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9AeS1zd2VldC9zZGsvc3JjL2VuY29kaW5nLnRzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9AeS1zd2VldC9zZGsvc3JjL21haW4udHMiLCAiLi4vLi4vZ3JhcGgvY29kZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqIE1ldGFkYXRhIGFzc29jaWF0ZWQgd2l0aCBhIHtAbGluayBZU3dlZXRFcnJvcn0uICovXG5leHBvcnQgdHlwZSBZU3dlZXRFcnJvclBheWxvYWQgPVxuICB8IHsgY29kZTogJ1NlcnZlclJlZnVzZWQnOyBhZGRyZXNzOiBzdHJpbmc7IHBvcnQ6IG51bWJlcjsgdXJsOiBzdHJpbmcgfVxuICB8IHsgY29kZTogJ1NlcnZlckVycm9yJzsgc3RhdHVzOiBudW1iZXI7IG1lc3NhZ2U6IHN0cmluZzsgdXJsOiBzdHJpbmcgfVxuICB8IHsgY29kZTogJ05vQXV0aFByb3ZpZGVkJyB9XG4gIHwgeyBjb2RlOiAnSW52YWxpZEF1dGhQcm92aWRlZCcgfVxuICB8IHsgY29kZTogJ1Vua25vd24nOyBtZXNzYWdlOiBzdHJpbmcgfVxuXG4vKiogQW4gZXJyb3IgcmV0dXJuZWQgYnkgdGhlIHktc3dlZXQgU0RLLiAqL1xuZXhwb3J0IGNsYXNzIFlTd2VldEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHtAbGluayBZU3dlZXRFcnJvcn0uXG4gICAqXG4gICAqIEBwYXJhbSBjYXVzZSBBbiBvYmplY3QgcmVwcmVzZW50aW5nIG1ldGFkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgZXJyb3IuXG4gICAqIEBzZWUge0BsaW5rIFlTd2VldEVycm9yUGF5bG9hZH1cbiAgICovXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjYXVzZTogWVN3ZWV0RXJyb3JQYXlsb2FkKSB7XG4gICAgc3VwZXIoWVN3ZWV0RXJyb3IuZ2V0TWVzc2FnZShjYXVzZSkpXG4gICAgdGhpcy5uYW1lID0gJ1lTd2VldEVycm9yJ1xuICB9XG5cbiAgLyoqIENvbnZlcnQgdGhlIG1lc3NhZ2UgdG8gYW4gZXJyb3Igc3RyaW5nIHRoYXQgY2FuIGJlIGRpc3BsYXllZCB0byB0aGUgdXNlci5cbiAgICpcbiAgICogVGhlIGVycm9yIHN0cmluZyBjYW4gYWxzbyBiZSB1c2VkIHdpdGgge0BsaW5rIFlTd2VldEVycm9yLmZyb21NZXNzYWdlfSB0b1xuICAgKiByZWNvbnN0cnVjdCB0aGUgcGF5bG9hZCBvYmplY3QsIHdoaWNoIGlzIHVzZWZ1bCBpbiB0aGUgY29udGV4dCBvZiBOZXh0LmpzLFxuICAgKiB3aGljaCB3aWxsIG9ubHkgcGFzcyBhbiBlcnJvciBzdHJpbmcgZnJvbSB0aGUgc2VydmVyIHRvIHRoZSBjbGllbnQuXG4gICAqXG4gICAqIEBwYXJhbSBwYXlsb2FkIFRoZSBwYXlsb2FkIG9iamVjdCB0byBjb252ZXJ0IHRvIGEgc3RyaW5nLlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZXJyb3IuXG4gICAqL1xuICBzdGF0aWMgZ2V0TWVzc2FnZShwYXlsb2FkOiBZU3dlZXRFcnJvclBheWxvYWQpOiBzdHJpbmcge1xuICAgIGxldCBtZXNzYWdlXG4gICAgaWYgKHBheWxvYWQuY29kZSA9PT0gJ1NlcnZlclJlZnVzZWQnKSB7XG4gICAgICBtZXNzYWdlID0gYFNlcnZlciBhdCAke3BheWxvYWQuYWRkcmVzc306JHtwYXlsb2FkLnBvcnR9IHJlZnVzZWQgY29ubmVjdGlvbi4gVVJMOiAke3BheWxvYWQudXJsfWBcbiAgICB9IGVsc2UgaWYgKHBheWxvYWQuY29kZSA9PT0gJ1NlcnZlckVycm9yJykge1xuICAgICAgbWVzc2FnZSA9IGBTZXJ2ZXIgcmVzcG9uZGVkIHdpdGggJHtwYXlsb2FkLnN0YXR1c30gJHtwYXlsb2FkLm1lc3NhZ2V9LiBVUkw6ICR7cGF5bG9hZC51cmx9YFxuICAgIH0gZWxzZSBpZiAocGF5bG9hZC5jb2RlID09PSAnTm9BdXRoUHJvdmlkZWQnKSB7XG4gICAgICBtZXNzYWdlID0gJ05vIGF1dGggcHJvdmlkZWQnXG4gICAgfSBlbHNlIGlmIChwYXlsb2FkLmNvZGUgPT09ICdJbnZhbGlkQXV0aFByb3ZpZGVkJykge1xuICAgICAgbWVzc2FnZSA9ICdJbnZhbGlkIGF1dGggcHJvdmlkZWQnXG4gICAgfSBlbHNlIHtcbiAgICAgIG1lc3NhZ2UgPSBwYXlsb2FkLm1lc3NhZ2VcbiAgICB9XG4gICAgcmV0dXJuIGAke3BheWxvYWQuY29kZX06ICR7bWVzc2FnZX1gXG4gIH1cblxuICAvKipcbiAgICogSW4gZGV2ZWxvcG1lbnQsIG5leHQuanMgcGFzc2VzIGVycm9yIG9iamVjdHMgdG8gdGhlIGNsaWVudCBidXQgc3RyaXBzIG91dCBldmVyeXRoaW5nIGJ1dCB0aGVcbiAgICogYG1lc3NhZ2VgIGZpZWxkLiBUaGlzIG1ldGhvZCBhbGxvd3MgdXMgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIGVycm9yIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2VTdHJpbmcgVGhlIGVycm9yIG1lc3NhZ2Ugc3RyaW5nIHRvIHJlY29uc3RydWN0IGEgcGF5bG9hZCBmcm9tLlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBZU3dlZXRFcnJvcn0gb2JqZWN0LlxuICAgKiBAc2VlIHtAbGluayBodHRwczovL25leHRqcy5vcmcvZG9jcy9hcHAvYXBpLXJlZmVyZW5jZS9maWxlLWNvbnZlbnRpb25zL2Vycm9yI2Vycm9ybWVzc2FnZXwgTmV4dC5qcyBkb2NzfVxuICAgKi9cbiAgc3RhdGljIGZyb21NZXNzYWdlKG1lc3NhZ2VTdHJpbmc6IHN0cmluZyk6IFlTd2VldEVycm9yIHtcbiAgICBsZXQgbWF0Y2ggPSBtZXNzYWdlU3RyaW5nLm1hdGNoKC9eKC4qPyk6ICguKikkLylcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICByZXR1cm4gbmV3IFlTd2VldEVycm9yKHsgY29kZTogJ1Vua25vd24nLCBtZXNzYWdlOiBtZXNzYWdlU3RyaW5nIH0pXG4gICAgfVxuXG4gICAgbGV0IFssIGNvZGUsIG1lc3NhZ2VdID0gbWF0Y2hcblxuICAgIGlmIChjb2RlID09PSAnU2VydmVyUmVmdXNlZCcpIHtcbiAgICAgIG1hdGNoID0gbWVzc2FnZS5tYXRjaCgvXlNlcnZlciBhdCAoLio/KTooXFxkKykgcmVmdXNlZCBjb25uZWN0aW9uLiBVUkw6ICguKikkLylcbiAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBZU3dlZXRFcnJvcih7IGNvZGU6ICdVbmtub3duJywgbWVzc2FnZTogbWVzc2FnZVN0cmluZyB9KVxuICAgICAgfVxuXG4gICAgICBsZXQgWywgYWRkcmVzcywgcG9ydCwgdXJsXSA9IG1hdGNoXG4gICAgICByZXR1cm4gbmV3IFlTd2VldEVycm9yKHsgY29kZSwgYWRkcmVzcywgcG9ydDogcGFyc2VJbnQocG9ydCksIHVybCB9KVxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSAnU2VydmVyRXJyb3InKSB7XG4gICAgICBtYXRjaCA9IG1lc3NhZ2UubWF0Y2goL15TZXJ2ZXIgcmVzcG9uZGVkIHdpdGggKFxcZCspICguKikuIFVSTDogKC4qKSQvKVxuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICByZXR1cm4gbmV3IFlTd2VldEVycm9yKHsgY29kZTogJ1Vua25vd24nLCBtZXNzYWdlOiBtZXNzYWdlU3RyaW5nIH0pXG4gICAgICB9XG5cbiAgICAgIGxldCBbLCBzdGF0dXMsIHN0YXR1c1RleHQsIHVybF0gPSBtYXRjaFxuICAgICAgcmV0dXJuIG5ldyBZU3dlZXRFcnJvcih7IGNvZGUsIHN0YXR1czogcGFyc2VJbnQoc3RhdHVzKSwgbWVzc2FnZTogc3RhdHVzVGV4dCwgdXJsIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09ICdOb0F1dGhQcm92aWRlZCcpIHtcbiAgICAgIHJldHVybiBuZXcgWVN3ZWV0RXJyb3IoeyBjb2RlIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPT09ICdJbnZhbGlkQXV0aFByb3ZpZGVkJykge1xuICAgICAgcmV0dXJuIG5ldyBZU3dlZXRFcnJvcih7IGNvZGUgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFlTd2VldEVycm9yKHsgY29kZTogJ1Vua25vd24nLCBtZXNzYWdlIH0pXG4gIH1cbn1cbiIsICJpbXBvcnQgeyBZU3dlZXRFcnJvciB9IGZyb20gJy4vZXJyb3InXG5cbi8qKiBBIHR5cGUgdGhhdCBjYW4gYmUgdXNlZCBhcyBhbiBIVFRQIHJlcXVlc3QgYm9keS5cbiAqIElmIGEgYFVpbnQ4QXJyYXlgIGlzIHByb3ZpZGVkLCB0aGUgYm9keSBpcyBzZW50IGFzIGEgcmF3IGJpbmFyeSBib2R5XG4gKiB3aXRoIHRoZSBgQ29udGVudC1UeXBlYCBoZWFkZXIgc2V0IHRvIGBhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1gLlxuICogT3RoZXJ3aXNlLCB0aGUgYm9keSBpcyBzZW50IGFzIGEgSlNPTiBib2R5IHdpdGggdGhlIGBDb250ZW50LVR5cGVgXG4gKiBoZWFkZXIgc2V0IHRvIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAqL1xuZXhwb3J0IHR5cGUgQm9keVR5cGUgPSBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgVWludDhBcnJheVxuXG5leHBvcnQgY2xhc3MgSHR0cENsaWVudCB7XG4gIHByaXZhdGUgdG9rZW46IHN0cmluZyB8IG51bGwgPSBudWxsXG4gIHByaXZhdGUgYmFzZVVybDogc3RyaW5nXG5cbiAgY29uc3RydWN0b3IoYmFzZVVybDogc3RyaW5nLCB0b2tlbjogc3RyaW5nIHwgbnVsbCkge1xuICAgIHRoaXMuYmFzZVVybCA9IGJhc2VVcmxcbiAgICB0aGlzLnRva2VuID0gdG9rZW5cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyByZXF1ZXN0KHVybDogc3RyaW5nLCBtZXRob2Q6ICdHRVQnKTogUHJvbWlzZTxSZXNwb25zZT5cbiAgcHVibGljIGFzeW5jIHJlcXVlc3QodXJsOiBzdHJpbmcsIG1ldGhvZDogJ1BPU1QnLCBib2R5OiBCb2R5VHlwZSk6IFByb21pc2U8UmVzcG9uc2U+XG5cbiAgcHVibGljIGFzeW5jIHJlcXVlc3QocGF0aDogc3RyaW5nLCBtZXRob2Q6ICdHRVQnIHwgJ1BPU1QnLCBib2R5PzogQm9keVR5cGUpOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gICAgY29uc3QgaGVhZGVycyA9IG5ldyBIZWFkZXJzKClcbiAgICBpZiAodGhpcy50b2tlbikge1xuICAgICAgaGVhZGVycy5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dGhpcy50b2tlbn1gKVxuICAgIH1cblxuICAgIGxldCByYXdCb2R5OiBzdHJpbmcgfCBVaW50OEFycmF5XG4gICAgaWYgKGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICBoZWFkZXJzLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScpXG4gICAgICByYXdCb2R5ID0gYm9keVxuICAgIH0gZWxzZSBpZiAoYm9keSkge1xuICAgICAgaGVhZGVycy5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgIHJhd0JvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5KVxuICAgIH1cblxuICAgIC8vIE5PVEU6IEluIHNvbWUgZW52aXJvbm1lbnRzIChlLmcuIE5leHRKUyksIHJlc3BvbnNlcyBhcmUgY2FjaGVkIGJ5IGRlZmF1bHQuIERpc2FibGluZ1xuICAgIC8vIHRoZSBjYWNoZSB1c2luZyBgY2FjaGU6ICduby1zdG9yZSdgIGNhdXNlcyBmZXRjaCgpIHRvIGVycm9yIGluIG90aGVyIGVudmlyb25tZW50c1xuICAgIC8vIChlLmcuIENsb3VkZmxhcmUgV29ya2VycykuIFRvIHdvcmsgYXJvdW5kIHRoaXMsIHdlIHNpbXBseSBhZGQgYSBjYWNoZS1idXN0aW5nIHF1ZXJ5XG4gICAgLy8gcGFyYW0uXG4gICAgY29uc3QgY2FjaGVCdXN0ID0gZ2VuZXJhdGVSYW5kb21TdHJpbmcoKVxuICAgIGxldCB1cmwgPSBgJHt0aGlzLmJhc2VVcmx9LyR7cGF0aH0/ej0ke2NhY2hlQnVzdH1gXG4gICAgbGV0IHJlc3VsdDogUmVzcG9uc2VcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZCxcbiAgICAgICAgYm9keTogcmF3Qm9keSEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmIChlcnJvci5jYXVzZT8uY29kZSA9PT0gJ0VDT05OUkVGVVNFRCcpIHtcbiAgICAgICAgbGV0IHsgYWRkcmVzcywgcG9ydCB9ID0gZXJyb3IuY2F1c2VcbiAgICAgICAgdGhyb3cgbmV3IFlTd2VldEVycm9yKHsgY29kZTogJ1NlcnZlclJlZnVzZWQnLCBhZGRyZXNzLCBwb3J0LCB1cmwgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBZU3dlZXRFcnJvcih7IGNvZGU6ICdVbmtub3duJywgbWVzc2FnZTogZXJyb3IudG9TdHJpbmcoKSB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgIGlmICh0aGlzLnRva2VuKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFlTd2VldEVycm9yKHsgY29kZTogJ0ludmFsaWRBdXRoUHJvdmlkZWQnIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFlTd2VldEVycm9yKHsgY29kZTogJ05vQXV0aFByb3ZpZGVkJyB9KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRocm93IG5ldyBZU3dlZXRFcnJvcih7XG4gICAgICAgIGNvZGU6ICdTZXJ2ZXJFcnJvcicsXG4gICAgICAgIHN0YXR1czogcmVzdWx0LnN0YXR1cyxcbiAgICAgICAgbWVzc2FnZTogcmVzdWx0LnN0YXR1c1RleHQsXG4gICAgICAgIHVybCxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUmFuZG9tU3RyaW5nKCk6IHN0cmluZyB7XG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMilcbn1cbiIsICJpbXBvcnQgeyBIdHRwQ2xpZW50IH0gZnJvbSAnLi9odHRwJ1xuaW1wb3J0IHsgQ2xpZW50VG9rZW4gfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgY2xhc3MgRG9jQ29ubmVjdGlvbiB7XG4gIHByaXZhdGUgY2xpZW50OiBIdHRwQ2xpZW50XG4gIHByaXZhdGUgZG9jSWQ6IHN0cmluZ1xuXG4gIGNvbnN0cnVjdG9yKGNsaWVudFRva2VuOiBDbGllbnRUb2tlbikge1xuICAgIC8vIFN0cmlwIHRyYWlsaW5nIHNsYXNoIGZyb20gYmFzZVVybFxuICAgIGxldCBiYXNlVXJsID0gY2xpZW50VG9rZW4uYmFzZVVybC5yZXBsYWNlKC9cXC8kLywgJycpXG4gICAgdGhpcy5jbGllbnQgPSBuZXcgSHR0cENsaWVudChiYXNlVXJsLCBjbGllbnRUb2tlbi50b2tlbiA/PyBudWxsKVxuICAgIHRoaXMuZG9jSWQgPSBjbGllbnRUb2tlbi5kb2NJZFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gZW50aXJlIGRvY3VtZW50LCByZXByZXNlbnRlZCBhcyBhIFlqcyB1cGRhdGUgYnl0ZSBzdHJpbmcuXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHR1cm5lZCBiYWNrIGludG8gYSBZanMgZG9jdW1lbnQgYXMgZm9sbG93czpcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBpbXBvcnQgKiBhcyBZIGZyb20gJ3lqcydcbiAgICpcbiAgICogbGV0IHVwZGF0ZSA9IGF3YWl0IG1hbmFnZXIuZ2V0RG9jQXNVcGRhdGUoZG9jSWQpXG4gICAqIGxldCBkb2MgPSBuZXcgWS5Eb2MoKVxuICAgKiBkb2MudHJhbnNhY3QoKCkgPT4ge1xuICAgKiAgWS5hcHBseVVwZGF0ZShkb2MsIHVwZGF0ZSlcbiAgICogfSlcbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZ2V0QXNVcGRhdGUoKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbGllbnQucmVxdWVzdChgYXMtdXBkYXRlYCwgJ0dFVCcpXG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGdldCBkb2MgJHt0aGlzLmRvY0lkfTogJHtyZXN1bHQuc3RhdHVzfSAke3Jlc3VsdC5zdGF0dXNUZXh0fWApXG4gICAgfVxuXG4gICAgbGV0IGJ1ZmZlciA9IGF3YWl0IHJlc3VsdC5hcnJheUJ1ZmZlcigpXG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ1ZmZlcilcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGEgZG9jdW1lbnQgd2l0aCB0aGUgZ2l2ZW4gWWpzIHVwZGF0ZSBieXRlIHN0cmluZy5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgZ2VuZXJhdGVkIGZyb20gYSBZanMgZG9jdW1lbnQgYXMgZm9sbG93czpcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBpbXBvcnQgKiBhcyBZIGZyb20gJ3lqcydcbiAgICpcbiAgICogbGV0IGRvYyA9IG5ldyBZLkRvYygpXG4gICAqIC8vIE1vZGlmeSB0aGUgZG9jdW1lbnQuLi5cbiAgICogbGV0IHVwZGF0ZSA9IFkuZW5jb2RlU3RhdGVBc1VwZGF0ZShkb2MpXG4gICAqIGF3YWl0IG1hbmFnZXIudXBkYXRlRG9jKGRvY0lkLCB1cGRhdGUpXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gdXBkYXRlXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgdXBkYXRlRG9jKHVwZGF0ZTogVWludDhBcnJheSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2xpZW50LnJlcXVlc3QoYHVwZGF0ZWAsICdQT1NUJywgdXBkYXRlKVxuXG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHVwZGF0ZSBkb2MgJHt0aGlzLmRvY0lkfTogJHtyZXN1bHQuc3RhdHVzfSAke3Jlc3VsdC5zdGF0dXNUZXh0fWApXG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQ2xpZW50VG9rZW4gfSBmcm9tICcuL3R5cGVzJ1xuXG5mdW5jdGlvbiBzdHJpbmdUb0Jhc2U2NChpbnB1dDogc3RyaW5nKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuYnRvYSkge1xuICAgIC8vIEJyb3dzZXJcbiAgICByZXR1cm4gd2luZG93LmJ0b2EoaW5wdXQpXG4gIH0gZWxzZSBpZiAodHlwZW9mIEJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBOb2RlLmpzXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGlucHV0KS50b1N0cmluZygnYmFzZTY0JylcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBlbmNvZGUgdG8gQmFzZTY0JylcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb1N0cmluZyhpbnB1dDogc3RyaW5nKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuYXRvYikge1xuICAgIC8vIEJyb3dzZXJcbiAgICByZXR1cm4gd2luZG93LmF0b2IoaW5wdXQpXG4gIH0gZWxzZSBpZiAodHlwZW9mIEJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBOb2RlLmpzXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGlucHV0LCAnYmFzZTY0JykudG9TdHJpbmcoKVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGRlY29kZSBmcm9tIEJhc2U2NCcpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZUNsaWVudFRva2VuKHRva2VuOiBDbGllbnRUb2tlbik6IHN0cmluZyB7XG4gIGNvbnN0IGpzb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0b2tlbilcbiAgbGV0IGJhc2U2NCA9IHN0cmluZ1RvQmFzZTY0KGpzb25TdHJpbmcpXG4gIGJhc2U2NCA9IGJhc2U2NC5yZXBsYWNlKCcrJywgJy0nKS5yZXBsYWNlKCcvJywgJ18nKS5yZXBsYWNlKC89KyQvLCAnJylcbiAgcmV0dXJuIGJhc2U2NFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlQ2xpZW50VG9rZW4odG9rZW46IHN0cmluZyk6IENsaWVudFRva2VuIHtcbiAgbGV0IGJhc2U2NCA9IHRva2VuLnJlcGxhY2UoJy0nLCAnKycpLnJlcGxhY2UoJ18nLCAnLycpXG4gIHdoaWxlIChiYXNlNjQubGVuZ3RoICUgNCkge1xuICAgIGJhc2U2NCArPSAnPSdcbiAgfVxuICBjb25zdCBqc29uU3RyaW5nID0gYmFzZTY0VG9TdHJpbmcoYmFzZTY0KVxuICByZXR1cm4gSlNPTi5wYXJzZShqc29uU3RyaW5nKVxufVxuIiwgImltcG9ydCB7IERvY0Nvbm5lY3Rpb24gfSBmcm9tICcuL2Nvbm5lY3Rpb24nXG5leHBvcnQgeyBEb2NDb25uZWN0aW9uIH0gZnJvbSAnLi9jb25uZWN0aW9uJ1xuaW1wb3J0IHsgSHR0cENsaWVudCB9IGZyb20gJy4vaHR0cCdcbmltcG9ydCB0eXBlIHsgRG9jQ3JlYXRpb25SZXN1bHQsIENsaWVudFRva2VuLCBDaGVja1N0b3JlUmVzdWx0LCBBdXRoRG9jUmVxdWVzdCB9IGZyb20gJy4vdHlwZXMnXG5leHBvcnQgdHlwZSB7IERvY0NyZWF0aW9uUmVzdWx0LCBDbGllbnRUb2tlbiwgQ2hlY2tTdG9yZVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnXG5leHBvcnQgeyB0eXBlIFlTd2VldEVycm9yUGF5bG9hZCwgWVN3ZWV0RXJyb3IgfSBmcm9tICcuL2Vycm9yJ1xuZXhwb3J0IHsgZW5jb2RlQ2xpZW50VG9rZW4sIGRlY29kZUNsaWVudFRva2VuIH0gZnJvbSAnLi9lbmNvZGluZydcblxuLyoqIFJlcHJlc2VudHMgYW4gaW50ZXJmYWNlIHRvIGEgeS1zd2VldCBkb2N1bWVudCBtYW5hZ2VtZW50IGVuZHBvaW50LiAqL1xuZXhwb3J0IGNsYXNzIERvY3VtZW50TWFuYWdlciB7XG4gIC8qKiBXcmFwcyBhIGZldGNoIHJlcXVlc3Qgd2l0aCBhdXRob3JpemF0aW9uIGFuZCBlcnJvciBoYW5kbGluZy4gKi9cbiAgcHJpdmF0ZSBjbGllbnQ6IEh0dHBDbGllbnRcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHtAbGluayBEb2N1bWVudE1hbmFnZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gc2VydmVyVG9rZW4gQSBjb25uZWN0aW9uIHN0cmluZyAoc3RhcnRpbmcgd2l0aCBgeXM6Ly9gIG9yIGB5c3M6Ly9gKSByZWZlcnJpbmcgdG8gYSB5LXN3ZWV0IHNlcnZlci5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb25TdHJpbmc6IHN0cmluZykge1xuICAgIGNvbnN0IHBhcnNlZFVybCA9IG5ldyBVUkwoY29ubmVjdGlvblN0cmluZylcblxuICAgIGxldCB0b2tlbiA9IG51bGxcbiAgICBpZiAocGFyc2VkVXJsLnVzZXJuYW1lKSB7XG4gICAgICAvLyBEZWNvZGUgdGhlIHRva2VuIGZyb20gdGhlIFVSTC5cbiAgICAgIHRva2VuID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnNlZFVybC51c2VybmFtZSlcbiAgICB9XG5cbiAgICBsZXQgcHJvdG9jb2wgPSBwYXJzZWRVcmwucHJvdG9jb2xcbiAgICBpZiAocHJvdG9jb2wgPT09ICd5czonKSB7XG4gICAgICBwcm90b2NvbCA9ICdodHRwOidcbiAgICB9IGVsc2UgaWYgKHByb3RvY29sID09PSAneXNzOicpIHtcbiAgICAgIHByb3RvY29sID0gJ2h0dHBzOidcbiAgICB9XG5cbiAgICAvLyBOQjogd2UgbWFudWFsbHkgY29uc3RydWN0IHRoZSBzdHJpbmcgaGVyZSBiZWNhdXNlIG5vZGUncyBVUkwgaW1wbGVtZW50YXRpb24gZG9lc1xuICAgIC8vICAgICBub3QgaGFuZGxlIGNoYW5naW5nIHRoZSBwcm90b2NvbCBvZiBhIFVSTCB3ZWxsLlxuICAgIC8vICAgICBzZWU6IGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvdXJsLmh0bWwjdXJscHJvdG9jb2xcbiAgICBjb25zdCB1cmwgPSBgJHtwcm90b2NvbH0vLyR7cGFyc2VkVXJsLmhvc3R9JHtwYXJzZWRVcmwucGF0aG5hbWV9YFxuICAgIGxldCBiYXNlVXJsID0gdXJsLnJlcGxhY2UoL1xcLyQvLCAnJykgLy8gUmVtb3ZlIHRyYWlsaW5nIHNsYXNoXG5cbiAgICB0aGlzLmNsaWVudCA9IG5ldyBIdHRwQ2xpZW50KGJhc2VVcmwsIHRva2VuKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGNoZWNrU3RvcmUoKTogUHJvbWlzZTxDaGVja1N0b3JlUmVzdWx0PiB7XG4gICAgcmV0dXJuIGF3YWl0IChhd2FpdCB0aGlzLmNsaWVudC5yZXF1ZXN0KCdjaGVja19zdG9yZScsICdQT1NUJywge30pKS5qc29uKClcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGRvY3VtZW50IG9uIHRoZSB5LXN3ZWV0IHNlcnZlciBnaXZlbiBhbiBvcHRpb25hbCBkb2NJZC4gSWYgYSBkb2N1bWVudCB3aXRoIGdpdmVuXG4gICAqIElEIGFscmVhZHkgZXhpc3RzLCB0aGlzIGlzIGEgbm8tb3AuXG4gICAqXG4gICAqIEBwYXJhbSBkb2NJZCBUaGUgSUQgb2YgdGhlIGRvY3VtZW50IHRvIGJlIGNyZWF0ZWQuIElmIG5vdCBwcm92aWRlZCwgYSByYW5kb20gSUQgd2lsbCBiZSBnZW5lcmF0ZWQuXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIERvY0NyZWF0aW9uUmVzdWx0fSBvYmplY3QgY29udGFpbmluZyB0aGUgSUQgb2YgdGhlIGNyZWF0ZWQgZG9jdW1lbnQuXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgY3JlYXRlRG9jKGRvY0lkPzogc3RyaW5nKTogUHJvbWlzZTxEb2NDcmVhdGlvblJlc3VsdD4ge1xuICAgIGNvbnN0IGJvZHkgPSBkb2NJZCA/IHsgZG9jSWQgfSA6IHt9XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbGllbnQucmVxdWVzdCgnZG9jL25ldycsICdQT1NUJywgYm9keSlcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIGRvYzogJHtyZXN1bHQuc3RhdHVzfSAke3Jlc3VsdC5zdGF0dXNUZXh0fWApXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IChhd2FpdCByZXN1bHQuanNvbigpKSBhcyBEb2NDcmVhdGlvblJlc3VsdFxuICAgIHJldHVybiByZXNwb25zZUJvZHlcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjbGllbnQgdG9rZW4gZm9yIHRoZSBnaXZlbiBkb2N1bWVudC5cbiAgICpcbiAgICogSWYgeW91IGFyZSB1c2luZyBhdXRob3JpemF0aW9uLCB0aGlzIGlzIGV4cGVjdGVkIHRvIGJlIGNhbGxlZCBmcm9tIHlvdXIgc2VydmVyXG4gICAqIGFmdGVyIGEgdXNlciBoYXMgYXV0aGVudGljYXRlZC4gVGhlIHJldHVybmVkIHRva2VuIHNob3VsZCB0aGVuIGJlIHBhc3NlZCB0byB0aGVcbiAgICogY2xpZW50LlxuICAgKlxuICAgKiBAcGFyYW0gZG9jSWQgVGhlIElEIG9mIHRoZSBkb2N1bWVudCB0byBnZXQgYSB0b2tlbiBmb3IuXG4gICAqIEBwYXJhbSBhdXRoRG9jUmVxdWVzdCBBbiBvcHRpb25hbCB7QGxpbmsgQXV0aERvY1JlcXVlc3R9IHByb3ZpZGluZyBvcHRpb25zIGZvciB0aGUgdG9rZW4gcmVxdWVzdC5cbiAgICogQHJldHVybnMgQSB7QGxpbmsgQ2xpZW50VG9rZW59IG9iamVjdCBjb250YWluaW5nIHRoZSBVUkwgYW5kIHRva2VuIG5lZWRlZCB0byBjb25uZWN0IHRvIHRoZSBkb2N1bWVudC5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBnZXRDbGllbnRUb2tlbihcbiAgICBkb2NJZDogc3RyaW5nIHwgRG9jQ3JlYXRpb25SZXN1bHQsXG4gICAgYXV0aERvY1JlcXVlc3Q/OiBBdXRoRG9jUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxDbGllbnRUb2tlbj4ge1xuICAgIGlmICh0eXBlb2YgZG9jSWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBkb2NJZCA9IGRvY0lkLmRvY0lkXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbGllbnQucmVxdWVzdChgZG9jLyR7ZG9jSWR9L2F1dGhgLCAnUE9TVCcsIGF1dGhEb2NSZXF1ZXN0ID8/IHt9KVxuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBhdXRoIGRvYyAke2RvY0lkfTogJHtyZXN1bHQuc3RhdHVzfSAke3Jlc3VsdC5zdGF0dXNUZXh0fWApXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IChhd2FpdCByZXN1bHQuanNvbigpKSBhcyBDbGllbnRUb2tlblxuICAgIHJldHVybiByZXNwb25zZUJvZHlcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNvbnZlbmllbmNlIHdyYXBwZXIgYXJvdW5kIHtAbGluayBEb2N1bWVudE1hbmFnZXIuY3JlYXRlRG9jfSBhbmQge0BsaW5rIERvY3VtZW50TWFuYWdlci5nZXRDbGllbnRUb2tlbn0gZm9yXG4gICAqIGdldHRpbmcgYSBjbGllbnQgdG9rZW4gZm9yIGEgZG9jdW1lbnQuIElmIGEgZG9jSWQgaXMgcHJvdmlkZWQsIGVuc3VyZXMgdGhhdCBhIGRvY3VtZW50IGV4aXN0cyB3aXRoIHRoYXQgSUQgb3JcbiAgICogdGhhdCBvbmUgaXMgY3JlYXRlZC4gSWYgbm8gZG9jSWQgaXMgcHJvdmlkZWQsIGEgbmV3IGRvY3VtZW50IGlzIGNyZWF0ZWQgd2l0aCBhIHJhbmRvbSBJRC5cbiAgICpcbiAgICogQHBhcmFtIGRvY0lkIFRoZSBJRCBvZiB0aGUgZG9jdW1lbnQgdG8gZ2V0IG9yIGNyZWF0ZS4gSWYgbm90IHByb3ZpZGVkLCBhIG5ldyBkb2N1bWVudCB3aXRoIGEgcmFuZG9tIElEIHdpbGwgYmUgY3JlYXRlZC5cbiAgICogQHBhcmFtIGF1dGhEb2NSZXF1ZXN0IEFuIG9wdGlvbmFsIHtAbGluayBBdXRoRG9jUmVxdWVzdH0gcHJvdmlkaW5nIG9wdGlvbnMgZm9yIHRoZSB0b2tlbiByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBDbGllbnRUb2tlbn0gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIFVSTCBhbmQgdG9rZW4gbmVlZGVkIHRvIGNvbm5lY3QgdG8gdGhlIGRvY3VtZW50LlxuICAgKi9cbiAgcHVibGljIGFzeW5jIGdldE9yQ3JlYXRlRG9jQW5kVG9rZW4oXG4gICAgZG9jSWQ/OiBzdHJpbmcsXG4gICAgYXV0aERvY1JlcXVlc3Q/OiBBdXRoRG9jUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxDbGllbnRUb2tlbj4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY3JlYXRlRG9jKGRvY0lkKVxuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldENsaWVudFRva2VuKHJlc3VsdCwgYXV0aERvY1JlcXVlc3QpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBlbnRpcmUgZG9jdW1lbnQsIHJlcHJlc2VudGVkIGFzIGEgWWpzIHVwZGF0ZSBieXRlIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIGRvY0lkIFRoZSBJRCBvZiB0aGUgZG9jdW1lbnQgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgZG9jdW1lbnQgYXMgYSBZanMgdXBkYXRlIGJ5dGUgc3RyaW5nXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZ2V0RG9jQXNVcGRhdGUoZG9jSWQ6IHN0cmluZyk6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCB0aGlzLmdldERvY0Nvbm5lY3Rpb24oZG9jSWQpXG4gICAgcmV0dXJuIGF3YWl0IGNvbm5lY3Rpb24uZ2V0QXNVcGRhdGUoKVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYSBkb2N1bWVudCB3aXRoIHRoZSBnaXZlbiBZanMgdXBkYXRlIGJ5dGUgc3RyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gZG9jSWQgVGhlIElEIG9mIHRoZSBkb2N1bWVudCB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSB1cGRhdGUgVGhlIFlqcyB1cGRhdGUgYnl0ZSBzdHJpbmcgdG8gYXBwbHkgdG8gdGhlIGRvY3VtZW50LlxuICAgKi9cbiAgcHVibGljIGFzeW5jIHVwZGF0ZURvYyhkb2NJZDogc3RyaW5nLCB1cGRhdGU6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgdGhpcy5nZXREb2NDb25uZWN0aW9uKGRvY0lkKVxuICAgIHJldHVybiBhd2FpdCBjb25uZWN0aW9uLnVwZGF0ZURvYyh1cGRhdGUpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0RG9jQ29ubmVjdGlvbihcbiAgICBkb2NJZDogc3RyaW5nIHwgRG9jQ3JlYXRpb25SZXN1bHQsXG4gICAgYXV0aERvY1JlcXVlc3Q/OiBBdXRoRG9jUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxEb2NDb25uZWN0aW9uPiB7XG4gICAgY29uc3QgY2xpZW50VG9rZW4gPSBhd2FpdCB0aGlzLmdldENsaWVudFRva2VuKGRvY0lkLCBhdXRoRG9jUmVxdWVzdClcbiAgICByZXR1cm4gbmV3IERvY0Nvbm5lY3Rpb24oY2xpZW50VG9rZW4pXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBkb2N1bWVudCB3aXRoIGluaXRpYWwgY29udGVudC5cbiAgICpcbiAgICogQHBhcmFtIHVwZGF0ZSBBIFlqcyB1cGRhdGUgYnl0ZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBpbml0aWFsIGNvbnRlbnQuXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIERvY0NyZWF0aW9uUmVzdWx0fSBvYmplY3QgY29udGFpbmluZyB0aGUgSUQgb2YgdGhlIGNyZWF0ZWQgZG9jdW1lbnQuXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgY3JlYXRlRG9jV2l0aENvbnRlbnQodXBkYXRlOiBVaW50OEFycmF5KTogUHJvbWlzZTxEb2NDcmVhdGlvblJlc3VsdD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY3JlYXRlRG9jKClcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZURvYyhyZXN1bHQuZG9jSWQsIHVwZGF0ZSlcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNvbnZlbmllbmNlIHdyYXBwZXIgYXJvdW5kIHtAbGluayBEb2N1bWVudE1hbmFnZXIuZ2V0T3JDcmVhdGVEb2NBbmRUb2tlbn0gZm9yIGdldHRpbmcgb3IgY3JlYXRpbmcgYSBkb2N1bWVudFxuICogd2l0aCB0aGUgZ2l2ZW4gSUQgYW5kIHJldHVybmluZyBhIGNsaWVudCB0b2tlbiBmb3IgYWNjZXNzaW5nIGl0LlxuICpcbiAqIEBwYXJhbSBjb25uZWN0aW9uU3RyaW5nIEEgY29ubmVjdGlvbiBzdHJpbmcgKHN0YXJ0aW5nIHdpdGggYHlzOi8vYCBvciBgeXNzOi8vYCkgcmVmZXJyaW5nIHRvIGEgeS1zd2VldCBzZXJ2ZXIuXG4gKiBAcGFyYW0gZG9jSWQgVGhlIElEIG9mIHRoZSBkb2N1bWVudCB0byBnZXQgb3IgY3JlYXRlLiBJZiBub3QgcHJvdmlkZWQsIGEgbmV3IGRvY3VtZW50IHdpdGggYSByYW5kb20gSUQgd2lsbCBiZSBjcmVhdGVkLlxuICogQHBhcmFtIGF1dGhEb2NSZXF1ZXN0IEFuIG9wdGlvbmFsIHtAbGluayBBdXRoRG9jUmVxdWVzdH0gcHJvdmlkaW5nIG9wdGlvbnMgZm9yIHRoZSB0b2tlbiByZXF1ZXN0LlxuICogQHJldHVybnMgQSB7QGxpbmsgQ2xpZW50VG9rZW59IG9iamVjdCBjb250YWluaW5nIHRoZSBVUkwgYW5kIHRva2VuIG5lZWRlZCB0byBjb25uZWN0IHRvIHRoZSBkb2N1bWVudC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE9yQ3JlYXRlRG9jQW5kVG9rZW4oXG4gIGNvbm5lY3Rpb25TdHJpbmc6IHN0cmluZyxcbiAgZG9jSWQ/OiBzdHJpbmcsXG4gIGF1dGhEb2NSZXF1ZXN0PzogQXV0aERvY1JlcXVlc3QsXG4pOiBQcm9taXNlPENsaWVudFRva2VuPiB7XG4gIGNvbnN0IG1hbmFnZXIgPSBuZXcgRG9jdW1lbnRNYW5hZ2VyKGNvbm5lY3Rpb25TdHJpbmcpXG4gIHJldHVybiBhd2FpdCBtYW5hZ2VyLmdldE9yQ3JlYXRlRG9jQW5kVG9rZW4oZG9jSWQsIGF1dGhEb2NSZXF1ZXN0KVxufVxuXG4vKipcbiAqIEEgY29udmVuaWVuY2Ugd3JhcHBlciBhcm91bmQge0BsaW5rIERvY3VtZW50TWFuYWdlci5nZXRDbGllbnRUb2tlbn0gZm9yIGdldHRpbmcgYSBjbGllbnQgdG9rZW4gZm9yIGEgZG9jdW1lbnQuXG4gKlxuICogQHBhcmFtIGNvbm5lY3Rpb25TdHJpbmcgQSBjb25uZWN0aW9uIHN0cmluZyAoc3RhcnRpbmcgd2l0aCBgeXM6Ly9gIG9yIGB5c3M6Ly9gKSByZWZlcnJpbmcgdG8gYSB5LXN3ZWV0IHNlcnZlci5cbiAqIEBwYXJhbSBkb2NJZCBUaGUgSUQgb2YgdGhlIGRvY3VtZW50IHRvIGdldCBhIHRva2VuIGZvci5cbiAqIEBwYXJhbSBhdXRoRG9jUmVxdWVzdCBBbiBvcHRpb25hbCB7QGxpbmsgQXV0aERvY1JlcXVlc3R9IHByb3ZpZGluZyBvcHRpb25zIGZvciB0aGUgdG9rZW4gcmVxdWVzdC5cbiAqIEByZXR1cm5zIEEge0BsaW5rIENsaWVudFRva2VufSBvYmplY3QgY29udGFpbmluZyB0aGUgVVJMIGFuZCB0b2tlbiBuZWVkZWQgdG8gY29ubmVjdCB0byB0aGUgZG9jdW1lbnQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDbGllbnRUb2tlbihcbiAgY29ubmVjdGlvblN0cmluZzogc3RyaW5nLFxuICBkb2NJZDogc3RyaW5nIHwgRG9jQ3JlYXRpb25SZXN1bHQsXG4gIGF1dGhEb2NSZXF1ZXN0PzogQXV0aERvY1JlcXVlc3QsXG4pOiBQcm9taXNlPENsaWVudFRva2VuPiB7XG4gIGNvbnN0IG1hbmFnZXIgPSBuZXcgRG9jdW1lbnRNYW5hZ2VyKGNvbm5lY3Rpb25TdHJpbmcpXG4gIHJldHVybiBhd2FpdCBtYW5hZ2VyLmdldENsaWVudFRva2VuKGRvY0lkLCBhdXRoRG9jUmVxdWVzdClcbn1cblxuLyoqXG4gKiBBIGNvbnZlbmllbmNlIHdyYXBwZXIgYXJvdW5kIHtAbGluayBEb2N1bWVudE1hbmFnZXIuY3JlYXRlRG9jfSBmb3IgY3JlYXRpbmcgYSBuZXcgZG9jdW1lbnQuIElmIGEgZG9jdW1lbnQgd2l0aCB0aGVcbiAqIGdpdmVuIElEIGFscmVhZHkgZXhpc3RzLCB0aGlzIGlzIGEgbm8tb3AuXG4gKlxuICogQHBhcmFtIGNvbm5lY3Rpb25TdHJpbmcgQSBjb25uZWN0aW9uIHN0cmluZyAoc3RhcnRpbmcgd2l0aCBgeXM6Ly9gIG9yIGB5c3M6Ly9gKSByZWZlcnJpbmcgdG8gYSB5LXN3ZWV0IHNlcnZlci5cbiAqIEBwYXJhbSBkb2NJZCBUaGUgSUQgb2YgdGhlIGRvY3VtZW50IHRvIGNyZWF0ZS4gSWYgbm90IHByb3ZpZGVkLCBhIHJhbmRvbSBJRCB3aWxsIGJlIGdlbmVyYXRlZC5cbiAqIEByZXR1cm5zIEEge0BsaW5rIERvY0NyZWF0aW9uUmVzdWx0fSBvYmplY3QgY29udGFpbmluZyB0aGUgSUQgb2YgdGhlIGNyZWF0ZWQgZG9jdW1lbnQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVEb2MoXG4gIGNvbm5lY3Rpb25TdHJpbmc6IHN0cmluZyxcbiAgZG9jSWQ/OiBzdHJpbmcsXG4pOiBQcm9taXNlPERvY0NyZWF0aW9uUmVzdWx0PiB7XG4gIGNvbnN0IG1hbmFnZXIgPSBuZXcgRG9jdW1lbnRNYW5hZ2VyKGNvbm5lY3Rpb25TdHJpbmcpXG4gIHJldHVybiBhd2FpdCBtYW5hZ2VyLmNyZWF0ZURvYyhkb2NJZClcbn1cbiIsICJpbXBvcnQgeyBEb2N1bWVudE1hbmFnZXIgfSBmcm9tIFwiQHktc3dlZXQvc2RrXCI7XG5cbmNvbnN0IG1hbmFnZXIgPSBuZXcgRG9jdW1lbnRNYW5hZ2VyKFxuICAgIHByb2Nlc3MuZW52LkNPTk5FQ1RJT05fU1RSSU5HIHx8IFwieXM6Ly8xMjcuMC4wLjE6ODA4MFwiLFxuKTtcblxuY29uc3QgYXJndjEgPSBwcm9jZXNzLmFyZ3ZbMl07XG5cbihhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZCA9IGF3YWl0IG1hbmFnZXIuZ2V0T3JDcmVhdGVEb2NBbmRUb2tlbihhcmd2MSk7XG4gICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGQsIG51bGwsIDIpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgZXJyb3I6IGUsXG4gICAgICAgIH0sIG51bGwsIDIpKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn0pKClcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFTTyxJQUFNLGNBQU4sTUFBTSxxQkFBb0IsTUFBTTs7Ozs7OztFQU9yQyxZQUFtQixPQUEyQjtBQUM1QyxVQUFNLGFBQVksV0FBVyxLQUFLLENBQUM7QUFEbEIsU0FBQSxRQUFBO0FBRWpCLFNBQUssT0FBTztFQUNkOzs7Ozs7Ozs7O0VBV0EsT0FBTyxXQUFXLFNBQXFDO0FBQ3JELFFBQUk7QUFDSixRQUFJLFFBQVEsU0FBUyxpQkFBaUI7QUFDcEMsZ0JBQVUsYUFBYSxRQUFRLE9BQU8sSUFBSSxRQUFRLElBQUksNkJBQTZCLFFBQVEsR0FBRztJQUNoRyxXQUFXLFFBQVEsU0FBUyxlQUFlO0FBQ3pDLGdCQUFVLHlCQUF5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
