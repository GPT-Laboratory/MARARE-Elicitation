

import { useEffect, useRef, useState } from "react";
import { handleAiAudioStream } from "./HandleAiAudioStream";
import { useSelector } from "react-redux";
import { socketURL } from "./socketInstance";
import { mcpTools, sessionInstructions } from "./Helper/tools_format";

import { useRefs } from "./RefProvider";

// MCP Bridge class to handle tool calls
class MCPBridge {
  constructor(serverUrl = socketURL) {
    this.serverUrl = serverUrl;
    this.connected = false;
  }

  async connect() {
    try {
      const response = await fetch(`${this.serverUrl}/mcp/tools`);
      if (response.ok) {
        this.connected = true;
        console.log("✅ MCP Bridge connected");
        return true;
      }
    } catch (error) {
      console.error("❌ MCP Bridge connection failed:", error);
    }
    return false;
  }

  async callTool(toolName, parsedArgs) {
    try {
      console.log(`🔧 Calling MCP tool: ${toolName}`, parsedArgs);

      const response = await fetch(`${this.serverUrl}/mcp/tool/${toolName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedArgs),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ MCP tool result:", result);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error("❌ MCP tool call failed:", error);
      return { success: false, error: error.message };
    }
  }
}

const OpenAISession = ({
  ephemeralKey,
  jointPeers,
  isMeetingHost,
  localTranscript,
  remoteTranscript,
  meetingId,
  socket,
  peerConnections,
}) => {
  const agentChunkBuffer = useRef([]); // temporary buffer for agent chunks

  // console.log("localTranscript in OpenAISession:", localTranscript);


  const cleanupRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const [ConnectionStatus, setConnectionStatus] = useState("disconnected");
  const activeAgent = useSelector(
    (state) => state.MainStates_Slice.activateAgent
  );

  // const socket = getSocket();
  // console.log("mcp tool length ", mcpTools.length)
  const sessionActiveRef = useRef(false);
  const mcpBridgeRef = useRef(new MCPBridge());
  const {
    setAgentTranscript,
    agentTranscriptView,
    setAgentTranscriptView,
    addOrUpdateRemotePeer,
  } = useRefs();

  // Store function calls that are being built up
  const pendingFunctionCalls = useRef(new Map());


  useEffect(() => {
    // Reduce tab resource usage when agent is active
    if (activeAgent && document.hidden === false) {
      console.log("Optimizing for active tab audio streaming...");

      // Request idle callback for non-critical work
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          console.log("Running low-priority tasks during idle time");
        });
      }
    }
  }, [activeAgent]);


  useEffect(() => {
    console.log("activeAgent state changed:", activeAgent);

    if (activeAgent && !sessionActiveRef.current) {
      console.log("Starting session due to activeAgent becoming true");
      startSession().catch((err) => {
        console.error("Failed to start OpenAI session:", err);
        setConnectionStatus("disconnected");
      });
    }
    else if (!activeAgent && sessionActiveRef.current) {
      console.log("Stopping session due to activeAgent becoming false");
      stopSession();
    }
  }, [activeAgent]);













  // 3. NEW: Local handler for meeting context tool
  function handleMeetingContextTool(args) {
    const { query_type, search_keywords } = args;

    switch (query_type) {
      case 'full_transcript':
        return {
          success: true,
          data: {
            localTranscript: localTranscript || "No local transcript available",
            remoteTranscript: remoteTranscript || "No remote transcript available",
            meetingId: meetingId
          }
        };

      case 'summary':
        {
          const allText = `${localTranscript || ''} ${remoteTranscript || ''}`.trim();
          return {
            success: true,
            data: {
              summary: allText.length > 500
                ? allText.substring(0, 500) + "..."
                : allText || "No conversation yet",
              wordCount: allText.split(' ').length,
              meetingId: meetingId
            }
          };
        }

      case 'specific_topic':
        {
          const searchText = `${localTranscript || ''} ${remoteTranscript || ''}`.toLowerCase();
          const keywords = (search_keywords || '').toLowerCase();
          const relevant = searchText.includes(keywords);

          // Extract context around keywords
          let context = "Topic not found in transcript";
          if (relevant && keywords) {
            const index = searchText.indexOf(keywords);
            const start = Math.max(0, index - 100);
            const end = Math.min(searchText.length, index + 100);
            context = searchText.substring(start, end);
          }

          return {
            success: true,
            data: {
              found: relevant,
              context: context,
              searchKeywords: search_keywords
            }
          };
        }

      case 'participants':
        return {
          success: true,
          data: {
            participants: jointPeers?.map(p => ({
              name: p.remoteName || 'Unknown',
              userId: p.userId
            })) || [],
            totalParticipants: jointPeers?.length || 0
          }
        };

      default:
        return {
          success: false,
          error: "Invalid query_type"
        };
    }
  }






  useEffect(() => {
    console.log("jointPeers", jointPeers);

    if (!ephemeralKey || !isMeetingHost) return;

    const audioElement = document.createElement("audio");
    audioElement.autoplay = true;
    document.body.appendChild(audioElement);

    const button = document.createElement("button");
    button.innerText = "Close Session";
    button.onclick = stopSession;
    document.body.appendChild(button);
    button.style.position = "fixed";
    button.style.bottom = "10px";
    button.style.right = "10px";
    button.style.zIndex = "1000";
    button.style.display = "none";
    button.style.padding = "10px 20px";
    button.style.backgroundColor = "#007bff";
    button.style.color = "#fff";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.style.fontSize = "16px";
    button.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.3)";

    return () => {
      stopSession();
      audioElement.remove();
      button.remove();
    };
  }, [ephemeralKey, isMeetingHost, jointPeers]);

  let connectionAttempts = 0;
  const MAX_ATTEMPTS = 3;

  async function startSession() {
    try {
      if (sessionActiveRef.current) {
        console.log("Session already active, not starting a new one");
        return;
      }

      socket.emit('openai-agent-value', {
        meetingId: meetingId,
        activeAgent: true
      });

      sessionActiveRef.current = true;
      await mcpBridgeRef.current.connect();
      setConnectionStatus("connecting");
      connectionAttempts++;
      console.log(`Connection attempt ${connectionAttempts}/${MAX_ATTEMPTS}`);

      if (peerConnectionRef.current) {
        await stopConnection();
      }

      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(config);

      peerConnectionRef.current.addEventListener("connectionstatechange", () => {
        console.log("Connection state changed:", peerConnectionRef.current.connectionState);
        if (peerConnectionRef.current.connectionState === "connected") {
          setConnectionStatus("connected");
        } else if (
          peerConnectionRef.current.connectionState === "failed" ||
          peerConnectionRef.current.connectionState === "disconnected"
        ) {
          setConnectionStatus("disconnected");
        }
      });

      peerConnectionRef.current.addEventListener("signalingstatechange", () => {
        console.log("Signaling state changed:", peerConnectionRef.current.signalingState);
      });

      peerConnectionRef.current.ontrack = async (event) => {
        console.log("Received track from OpenAI");
        const remoteStream = event.streams[0];

        const audioElement = document.getElementById("ai-audio");
        if (audioElement) {
          audioElement.srcObject = remoteStream;
        }

        console.log("Received audio stream from OpenAI, broadcasting to peers...");

        if (jointPeers && jointPeers.current && jointPeers.current.length > 0) {
          try {
            const cleanup = await handleAiAudioStream(
              remoteStream,
              jointPeers,
              "OpenAI Assistant"
            );
            cleanupRef.current = cleanup;
            setConnectionStatus("connected");
          } catch (err) {
            console.error("Failed to broadcast OpenAI audio:", err);
          }
        } else {
          console.log("No peers to broadcast to");
          setConnectionStatus("connected");
        }
      };





      dataChannelRef.current = peerConnectionRef.current.createDataChannel(
        "oai-events",
        { ordered: true }
      );

      dataChannelRef.current.addEventListener("open", () => {
        console.log("Data channel is open");
        setTimeout(() => {
          updateSession();
        }, 100);
      });



      dataChannelRef.current.addEventListener("message", async (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("Received message from OpenAI:", msg);

          if (msg.delta && typeof msg.delta === "string") {
            setAgentTranscript((prev) => [...prev, msg.delta]);
            const handleAgentChunk = (chunkText) => {
              agentChunkBuffer.current.push(chunkText);

              if (agentChunkBuffer.current.length >= 40) {
                const combinedText = agentChunkBuffer.current.join(" ");
                setAgentTranscriptView((prev) => [
                  ...prev,
                  { text: combinedText, timestamp: Date.now() },
                ]);
                agentChunkBuffer.current = [];
              }
            };

            handleAgentChunk(msg.delta);


            // const currentTime = Date.now();
            // setAgentTranscriptView((prevTranscript) => {
            //   const newTranscript = { text: msg.delta, timestamp: currentTime };

            //   if (
            //     prevTranscript.length > 0 &&
            //     prevTranscript[prevTranscript.length - 1].text === msg.delta
            //   ) {
            //     return prevTranscript; // avoid duplicates
            //   }

            //   return [...prevTranscript, newTranscript];
            // });


          }



          // Handle function call arguments streaming
          if (msg.type === "response.output_item.delta" &&
            msg.item?.type === "function_call") {

            if (msg.delta?.arguments) {
              console.log("Function call arguments delta:", msg.delta.arguments);
              const functionCall = pendingFunctionCalls.current.get(msg.item.id) || {
                id: msg.item.id,
                call_id: msg.item.call_id || msg.item.id,
                name: msg.item.name,
                arguments: ""
              };

              functionCall.arguments += msg.delta.arguments;
              pendingFunctionCalls.current.set(msg.item.id, functionCall);
            }
          }

          // Handle function call completion - THIS IS THE KEY FIX
          if (msg.type === "response.output_item.done" &&
            msg.item?.type === "function_call") {
            console.log("Function call done:", msg.item);

            let functionCall = pendingFunctionCalls.current.get(msg.item.id);

            // If no pending call, create from the completed item
            if (!functionCall) {
              functionCall = {
                id: msg.item.id,
                call_id: msg.item.call_id,
                name: msg.item.name,
                arguments: msg.item.arguments || ""
              };
            }

            console.log("Final function call with arguments:", functionCall);
            await handleFunctionCall(functionCall);
            pendingFunctionCalls.current.delete(msg.item.id);
          }

        } catch (error) {
          console.error("Error processing message:", error);
        }
      });

      dataChannelRef.current.addEventListener("closing", () => {
        console.log("Data channel is closing");
      });

      dataChannelRef.current.addEventListener("close", () => {
        console.log("Data channel is closed");
        setConnectionStatus((prev) => prev !== "connecting" ? "disconnected" : prev);
      });

      dataChannelRef.current.addEventListener("error", (error) => {
        console.error("Data channel error:", error);
      });

      const clientMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (peerConnectionRef.current && clientMedia.getAudioTracks().length > 0) {
        const audioTrack = clientMedia.getAudioTracks()[0];
        console.log("Adding audio track to peer connection");
        peerConnectionRef.current.addTrack(audioTrack, clientMedia);

        const offerOptions = {
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        };

        const offer = await peerConnectionRef.current.createOffer(offerOptions);
        console.log("Offer SDP created:", offer.sdp.substring(0, 100) + "...");

        await peerConnectionRef.current.setLocalDescription(offer);
        console.log("Local description set successfully");

        await waitForIceGatheringComplete(peerConnectionRef.current);

        const completeOffer = peerConnectionRef.current.localDescription;
        console.log("Complete offer with ICE candidates ready");

        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";

        try {
          console.log("Sending offer to OpenAI API...");
          const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",
            body: completeOffer.sdp,
            headers: {
              Authorization: `Bearer ${ephemeralKey}`,
              "Content-Type": "application/sdp",
            },
          });

          if (!sdpResponse.ok) {
            const errorText = await sdpResponse.text();
            console.error(`OpenAI API returned ${sdpResponse.status}: ${errorText}`);
            throw new Error(`OpenAI API returned ${sdpResponse.status}: ${errorText}`);
          }

          const answerSdp = await sdpResponse.text();
          console.log("Received answer SDP:", answerSdp.substring(0, 100) + "...");

          if (peerConnectionRef.current &&
            (peerConnectionRef.current.signalingState === "have-local-offer" ||
              peerConnectionRef.current.signalingState === "stable")) {

            const answer = {
              type: "answer",
              sdp: answerSdp,
            };

            console.log("Setting remote description...");
            await peerConnectionRef.current.setRemoteDescription(answer);
            console.log("Successfully set remote description");

            setConnectionStatus("connected");
          } else {
            console.error("Cannot set remote description - peer connection is null or in wrong state:",
              peerConnectionRef.current ? peerConnectionRef.current.signalingState : "null");

            if (connectionAttempts < MAX_ATTEMPTS) {
              console.log("Retrying connection...");
              await new Promise((resolve) => setTimeout(resolve, 1000));
              await startSession();
            } else {
              throw new Error("Peer connection in wrong state for setting remote description");
            }
          }
        } catch (error) {
          console.error("Error setting up WebRTC connection:", error);

          if (connectionAttempts < MAX_ATTEMPTS) {
            console.log("Retrying connection after error...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await startSession();
          } else {
            throw error;
          }
        }
      } else {
        console.error("No audio tracks available or peer connection is null");
        setConnectionStatus("disconnected");
        sessionActiveRef.current = false;
      }
    } catch (error) {
      console.error("Error starting OpenAI session:", error);
      setConnectionStatus("disconnected");
      sessionActiveRef.current = false;
      await stopSession();
    }
  }

  // Function to handle tool calls from OpenAI
  async function handleFunctionCall(functionCallItem) {
    try {
      const { name: toolName, call_id, arguments: toolArgs } = functionCallItem;
      console.log("🔧 function call item", functionCallItem);
      console.log(`🔧 OpenAI requested tool call: ${toolName}`, toolArgs);

      // Parse arguments if they're a string
      let parsedArgs = toolArgs;
      if (typeof toolArgs === 'string' && toolArgs.trim() !== '') {
        try {
          parsedArgs = JSON.parse(toolArgs);
        } catch (e) {
          console.error("Failed to parse tool arguments:", e);
          parsedArgs = {};
        }
      } else if (!toolArgs || toolArgs === '') {
        console.log("No arguments provided, using empty object");
        parsedArgs = {};
      }

      console.log("📤 Parsed arguments:", parsedArgs);


      let result;

      // Handle meeting context tool locally (no need to call backend)
      if (toolName === 'get_meeting_context') {
        result = handleMeetingContextTool(parsedArgs);
      }
      else if (toolName === "web_search") {
        try {
          console.log("🌐 Performing web search with query:", parsedArgs.query);

          // ✅ Use CORS-safe proxy (all frontend)
          const searchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
            `https://serpapi.com/search.json?q=${encodeURIComponent(parsedArgs.query)}&api_key=a2dde1c83cca374ad0fc5d9e3f60861b5788e55116fa7b00a4ee14a196294405`
          )}`;

          const response = await fetch(searchUrl);
          const data = await response.json();

          const results =
            data.organic_results?.slice(0, 3)?.map((r) => ({
              title: r.title,
              link: r.link,
              snippet: r.snippet,
            })) || [];

          result = {
            success: true,
            source: "Google (via SerpAPI)",
            query: parsedArgs.query,
            summary:
              results.map((r) => `${r.title}: ${r.snippet}`).join("\n\n") ||
              "No summary found.",
            topResults: results,
          };

          console.log("✅ Web search results:", result);
        } catch (error) {
          console.error("❌ Web search error:", error);
          result = { success: false, error: error.message };
        }
      }

      else if (toolName === "get_weather") {
        const city = parsedArgs.location || "Rawalpindi";
        console.log("🌤️ Fetching weather for:", city);

        try {
          const apiKey = "2750d9853b472574b870f0a5e1fd505e"; // Get one free from openweathermap.org
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
          );
          const data = await response.json();

          if (data?.main) {
            result = {
              success: true,
              city: data.name,
              temperature: data.main.temp,
              condition: data.weather[0].description,
            };

            console.log("✅ Weather data:", result);
          } else {
            result = { success: false, error: "No weather data found" };
          }
        } catch (err) {
          console.error("❌ Weather fetch error:", err);
          result = { success: false, error: err.message };
        }
      }

      else {
        // Call backend MCP tools for Notion, etc.
        result = await mcpBridgeRef.current.callTool(toolName, parsedArgs);
      }




      // Call your MCP tool
      // const result = await mcpBridgeRef.current.callTool(toolName, parsedArgs);

      // Send the result back to OpenAI
      const functionResult = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify(result)
        }
      };



      if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
        dataChannelRef.current.send(JSON.stringify(functionResult));
        console.log("✅ Sent tool result back to OpenAI");

        // Trigger response generation
        setTimeout(() => {
          const responseEvent = {
            type: "response.create",
            response: {
              modalities: ["text", "audio"],
            },
          };
          dataChannelRef.current.send(JSON.stringify(responseEvent));
        }, 100);
      }

    } catch (error) {
      console.error("❌ Error handling function call:", error);

      // Send error back to OpenAI
      const errorResult = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallItem.call_id,
          output: JSON.stringify({
            success: false,
            error: error.message
          })
        }
      };

      if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
        dataChannelRef.current.send(JSON.stringify(errorResult));
      }
    }
  }

  function waitForIceGatheringComplete(pc) {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") {
        resolve();
        return;
      }

      const checkState = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", checkState);
          resolve();
        }
      };

      pc.addEventListener("icegatheringstatechange", checkState);
      setTimeout(resolve, 5000);
    });
  }

  const updateSession = () => {
    console.log("Attempting to update session...");

    if (!dataChannelRef.current) {
      console.error("Data channel is null");
      return;
    }

    console.log("Data channel ready state:", dataChannelRef.current.readyState);

    if (dataChannelRef.current.readyState === "open") {
      const event = {
        type: "session.update",
        session: {
          instructions: sessionInstructions,

          input_audio_transcription: {
            model: "whisper-1",
          },
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200,
          },

          // Add your MCP tools to the session

          tools: mcpTools

        },
      };

      try {
        dataChannelRef.current.send(JSON.stringify(event));
        console.log("Session update sent successfully with MCP tools");
      } catch (error) {
        console.error("Error sending session update:", error);
      }
    } else {
      console.error("Data channel is not open, current state:", dataChannelRef.current.readyState);

      if (dataChannelRef.current.readyState === "connecting") {
        console.log("Data channel is connecting, retrying in 500ms...");
        setTimeout(() => updateSession(), 500);
      }
    }
  };

  const stopConnection = async () => {
    console.log("Cleaning up existing connection...");

    if (dataChannelRef.current) {
      try {
        if (dataChannelRef.current.readyState === "open") {
          dataChannelRef.current.close();
        }
      } catch (e) {
        console.error("Error closing data channel:", e);
      } finally {
        dataChannelRef.current = null;
      }
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.close();
      } catch (e) {
        console.error("Error closing peer connection:", e);
      } finally {
        peerConnectionRef.current = null;
      }
    }
  };

  const stopSession = async () => {
    console.log("Stopping OpenAI session...");

    if (!sessionActiveRef.current) {
      console.log("Session already stopped, nothing to do");
      return;
    }

    await stopConnection();

    if (cleanupRef.current && typeof cleanupRef.current === "function") {
      try {
        cleanupRef.current();
      } catch (e) {
        console.error("Error in cleanup function:", e);
      } finally {
        cleanupRef.current = null;
      }
    }

    setConnectionStatus("disconnected");
    sessionActiveRef.current = false;

    console.log("OpenAI session stopped");
    socket.emit('openai-agent-value', {
      meetingId: meetingId,
      activeAgent: false
    });
  };

  return null;
};

export default OpenAISession;