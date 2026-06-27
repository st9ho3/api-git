import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EventsRepository } from "./events-repository.js";

export function createMcpServer(eventsRepository: EventsRepository) {
  const server = new McpServer({
    name: "learning-api",
    version: "0.1.0"
  });

  server.registerTool(
    "list_webhook_events",
    {
      title: "List webhook events",
      description: "Return stored GitHub webhook event summaries.",
      inputSchema: {}
    },
    async () => {
      const events = await eventsRepository.listEvents();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ events }, null, 2)
          }
        ]
      };
    }
  );

  return server;
}
