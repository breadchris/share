import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { Context } from "@/context";
import type { Resource } from "@/resources/resource";
import type { Tool } from "@/tools/tool";
import { createWebSocketServer } from "@/ws";

type Options = {
  name: string;
  version: string;
  tools: Tool[];
  resources: Resource[];
};

export async function createServerWithTools(options: Options): Promise<Server> {
  const { name, version, tools, resources } = options;
  const context = new Context();
  const server = new Server(
    { name, version },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  const wss = await createWebSocketServer();
  wss.on("connection", (websocket) => {
    console.log("Browser extension connected to BrowserMCP");
    
    // Close any existing connections
    if (context.hasWs()) {
      context.ws.close();
    }
    context.ws = websocket;

    // Handle extension messages
    websocket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("Received message from extension:", message);
        
        switch (message.type) {
          case 'extension_connected':
            console.log("Extension initialized at:", new Date(message.timestamp));
            break;
          case 'tab_connected':
            console.log(`Tab connected: ${message.title} (ID: ${message.tabId})`);
            // Store tab information in context for later use
            context.connectedTab = {
              id: message.tabId,
              url: message.url,
              title: message.title
            };
            break;
          case 'tab_disconnected':
            console.log(`Tab disconnected: ID ${message.tabId}`);
            if (context.connectedTab?.id === message.tabId) {
              context.connectedTab = null;
            }
            break;
          case 'page_content_response':
            // Handle page content responses for tools that request it
            console.log("Received page content response");
            break;
          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error parsing extension message:", error);
      }
    });

    websocket.on("close", () => {
      console.log("Browser extension disconnected");
    });
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: tools.map((tool) => tool.schema) };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: resources.map((resource) => resource.schema) };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((tool) => tool.schema.name === request.params.name);
    if (!tool) {
      return {
        content: [
          { type: "text", text: `Tool "${request.params.name}" not found` },
        ],
        isError: true,
      };
    }

    try {
      const result = await tool.handle(context, request.params.arguments);
      return result;
    } catch (error) {
      return {
        content: [{ type: "text", text: String(error) }],
        isError: true,
      };
    }
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = resources.find(
      (resource) => resource.schema.uri === request.params.uri,
    );
    if (!resource) {
      return { contents: [] };
    }

    const contents = await resource.read(context, request.params.uri);
    return { contents };
  });

  server.close = async () => {
    await server.close();
    await wss.close();
    await context.close();
  };

  return server;
}
