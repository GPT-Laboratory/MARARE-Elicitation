import { useEffect, useRef, useCallback } from "react";
// import { useSelector } from "react-redux";

// Basic MCP Bridge for intent detection and data fetch
class MCPBridge {
  constructor(serverUrl = "http://localhost:3000") {
    this.serverUrl = serverUrl;
    this.isConnected = false;
  }

  async connect() {
    try {
      const res = await fetch(`${this.serverUrl}/health`);
      this.isConnected = res.ok;
      return this.isConnected;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  // Intent detection - single responsibility
  isExternalIntent(text) {
    const input = text.toLowerCase();

    // 1. General intent verbs
    const actionIntents = [
      /get|fetch|show|retrieve|access/,
      /summarize|summary|overview/,
      /what\s+was\s+discussed|what\s+happened/,
      /find|search|look\s+up/,
      /content\s+of|notes\s+from|information\s+about/,
    ];

    // 2. Contextual tools
    const externalTools = [
      "notion",
      "slack",
      "jira",
      "github",
      "repository",
      "meeting",
    ];

    // 3. Check if it's a real request
    const isIntent = actionIntents.some((pattern) => pattern.test(input));
    const mentionsTool = externalTools.some((tool) => input.includes(tool));

    // 4. Only trigger if both conditions match
    return isIntent && mentionsTool;
  }

  async call(userInput) {
    if (!this.isConnected) await this.connect();
    const res = await fetch(`${this.serverUrl}/dipatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: userInput, agentName: "intelligent_agent", timestamp: new Date().toISOString() }),
    });

    const json = await res.json();
    return json;
  }
}

const OpenAISessionWithMCP = ({ dataChannelRef }) => {
  console.log("data channel ref", dataChannelRef)
  const mcpRef = useRef(new MCPBridge());


  const handleMessage = useCallback(async (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (
        msg.type !== "conversation.item.created" ||
        msg.item?.type !== "message"
      )
        return;

      const text = msg.item.content?.[0]?.text;
      if (!text) return;

      const isExternal = mcpRef.current.isExternalIntent(text);
      if (!isExternal) return; // Let OpenAI handle it if it's not external

      const result = await mcpRef.current.call(text);
      const response = result?.speech || JSON.stringify(result);

      const replyEvent = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: response }],
        },
      };

      dataChannelRef.current?.send(JSON.stringify(replyEvent));
    } catch (err) {
      console.error("Error handling MCP intent:", err);
    }
  }, []);

  useEffect(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.addEventListener("message", handleMessage);
      return () =>
        dataChannelRef.current.removeEventListener("message", handleMessage);
    }
  }, [dataChannelRef]);

  return null;
};

export default OpenAISessionWithMCP;
