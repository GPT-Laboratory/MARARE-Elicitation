

import { useCallback, useEffect, useRef, useState } from "react";
// import { handleAiAudioStream } from "./HandleAiAudioStream";
import { useDispatch, useSelector } from "react-redux";
import { socketURL } from "./socketInstance";
import { mcpTools, sessionInstructions } from "./Helper/tools_format";

import { useRefs } from "./RefProvider";
import { setAgentReady, setEphemeralKey } from "./features/mainStates/MainStates_Slice";
import { configuration } from "./Helper/PeerConnection";
import store from "../Redux/store";

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
  // ephemeralKey,
  jointPeers,
  isMeetingHost,
  localTranscript,
  remoteTranscript,
  meetingId,
  socket,
}) => {
  const agentChunkBuffer = useRef([]); // temporary buffer for agent chunks
  const dispatch = useDispatch();

  // Helper function to get fresh key from Redux store each time
  const getCurrentKey = () => {
    return store.getState().MainStates_Slice.ephemeralKey;
  };

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
    setAgentTranscriptView,
    remotePeers,
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
      const startFn = startSessionRef.current;
      if (startFn) {
        startFn().catch((err) => {
          console.error("Failed to start OpenAI session:", err);
          setConnectionStatus("disconnected");
        });
      }
    }
    else if (!activeAgent && sessionActiveRef.current) {
      console.log("Stopping session due to activeAgent becoming false");
      stopSessionRef.current?.();
    }
  }, [activeAgent]);













  // 3. NEW: Local handler for meeting context tool
  // function handleMeetingContextTool(args) {
  //   const { query_type, search_keywords } = args;

  //   switch (query_type) {
  //     case 'full_transcript':
  //       return {
  //         success: true,
  //         data: {
  //           localTranscript: localTranscript || "No local transcript available",
  //           remoteTranscript: remoteTranscript || "No remote transcript available",
  //           meetingId: meetingId
  //         }
  //       };

  //     case 'summary':
  //       {
  //         const allText = `${localTranscript || ''} ${remoteTranscript || ''}`.trim();
  //         return {
  //           success: true,
  //           data: {
  //             summary: allText.length > 500
  //               ? allText.substring(0, 500) + "..."
  //               : allText || "No conversation yet",
  //             wordCount: allText.split(' ').length,
  //             meetingId: meetingId
  //           }
  //         };
  //       }

  //     case 'specific_topic':
  //       {
  //         const searchText = `${localTranscript || ''} ${remoteTranscript || ''}`.toLowerCase();
  //         const keywords = (search_keywords || '').toLowerCase();
  //         const relevant = searchText.includes(keywords);

  //         // Extract context around keywords
  //         let context = "Topic not found in transcript";
  //         if (relevant && keywords) {
  //           const index = searchText.indexOf(keywords);
  //           const start = Math.max(0, index - 100);
  //           const end = Math.min(searchText.length, index + 100);
  //           context = searchText.substring(start, end);
  //         }

  //         return {
  //           success: true,
  //           data: {
  //             found: relevant,
  //             context: context,
  //             searchKeywords: search_keywords
  //           }
  //         };
  //       }

  //     case 'participants':
  //       return {
  //         success: true,
  //         data: {
  //           participants: jointPeers?.map(p => ({
  //             name: p.remoteName || 'Unknown',
  //             userId: p.userId
  //           })) || [],
  //           totalParticipants: jointPeers?.length || 0
  //         }
  //       };

  //     default:
  //       return {
  //         success: false,
  //         error: "Invalid query_type"
  //       };
  //   }
  // }

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
          const fullText = `${localTranscript || ''} ${remoteTranscript || ''}`.trim();
          
          if (!fullText) {
            return {
              success: true,
              data: {
                found: false,
                context: "No conversation transcript available yet",
                searchKeywords: search_keywords,
                relevantSections: []
              }
            };
          }
  
          // Split into sentences for better context extraction
          const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
          
          // Split keywords into individual terms for better matching
          const keywords = (search_keywords || '').toLowerCase().split(/\s+/).filter(k => k.length > 2);
          
          if (keywords.length === 0) {
            return {
              success: true,
              data: {
                found: false,
                context: "No search keywords provided",
                searchKeywords: search_keywords,
                relevantSections: []
              }
            };
          }
  
          // Find relevant sections with scoring
          const relevantSections = [];
          
          for (let i = 0; i < sentences.length; i++) {
            const sentenceLower = sentences[i].toLowerCase();
            let matchCount = 0;
            
            // Check how many keywords match
            for (const keyword of keywords) {
              if (sentenceLower.includes(keyword)) {
                matchCount++;
              }
            }
            
            // If any keywords match, include this section with context
            if (matchCount > 0) {
              const start = Math.max(0, i - 1); // Include previous sentence
              const end = Math.min(sentences.length, i + 2); // Include next sentence
              const contextText = sentences.slice(start, end).join('. ').trim();
              
              relevantSections.push({
                text: contextText,
                matchScore: matchCount,
                position: i
              });
            }
          }
  
          // Sort by match score (best matches first)
          relevantSections.sort((a, b) => b.matchScore - a.matchScore);
  
          const found = relevantSections.length > 0;
          
          // Combine top 3 relevant sections
          const topSections = relevantSections.slice(0, 3).map(s => s.text).join('\n\n---\n\n');
          
          return {
            success: true,
            data: {
              found: found,
              context: found ? topSections : "Topic not discussed in the meeting",
              searchKeywords: search_keywords,
              relevantSections: relevantSections.map(s => ({
                text: s.text,
                matchScore: s.matchScore
              })),
              matchCount: relevantSections.length
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

  const agentAudioStreamRef = useRef(null);
  const agentPeerConnectionsRef = useRef({});
  const startSessionRef = useRef(null);
  const stopSessionRef = useRef(null);

  const teardownAgentConnection = useCallback((targetUserId) => {
    const entry = agentPeerConnectionsRef.current[targetUserId];
    if (!entry) return;

    try {
      if (entry.track) {
        entry.track.stop();
      }
      entry.pc.onicecandidate = null;
      entry.pc.ontrack = null;
      entry.pc.close();
    } catch (error) {
      console.warn("Error cleaning up agent peer connection:", error);
    }

    delete agentPeerConnectionsRef.current[targetUserId];
  }, []);

  // Helper function to wait for ICE gathering to complete
  const waitForIceGatheringComplete = (pc) => {
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
      // Timeout after 5 seconds to prevent hanging
      setTimeout(() => {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }, 5000);
    });
  };

  const ensureAgentConnection = useCallback(
    async (targetUserId) => {
      if (!agentAudioStreamRef.current || agentPeerConnectionsRef.current[targetUserId]) {
        return;
      }

      const baseAudioTrack = agentAudioStreamRef.current.getAudioTracks()[0];
      if (!baseAudioTrack) {
        console.warn("No agent audio track available for peer streaming");
        return;
      }

      const outboundTrack = baseAudioTrack.clone();
      const outboundStream = new MediaStream([outboundTrack]);
      const pc = new RTCPeerConnection(configuration);

      agentPeerConnectionsRef.current[targetUserId] = {
        pc,
        track: outboundTrack,
      };

      outboundStream.getTracks().forEach((track) => pc.addTrack(track, outboundStream));

      // Track ICE candidates and send them
      const pendingIceCandidates = [];
      let iceGatheringComplete = false;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Store candidate if gathering not complete yet
          if (!iceGatheringComplete) {
            pendingIceCandidates.push(event.candidate);
          }

          socket.emit("agent-ice", {
            meetingId,
            fromUserId: "openai-agent",
            toUserId: targetUserId,
            candidate: event.candidate,
          });
        } else {
          // null candidate means ICE gathering is complete
          iceGatheringComplete = true;
          console.log(`✅ ICE gathering complete for agent peer ${targetUserId}`);
        }
      };

      // Enhanced connection state monitoring
      let connectionRetryCount = 0;
      const MAX_RETRIES = 2;

      pc.oniceconnectionstatechange = () => {
        console.log(`🧊 Agent ICE connection state for ${targetUserId}:`, pc.iceConnectionState);

        if (pc.iceConnectionState === "failed") {
          console.warn(`⚠️ Agent ICE connection failed for ${targetUserId}`);

          if (connectionRetryCount < MAX_RETRIES) {
            connectionRetryCount++;
            console.log(`🔄 Attempting ICE restart (${connectionRetryCount}/${MAX_RETRIES})...`);
            try {
              pc.restartIce();
            } catch (e) {
              console.error("Error restarting ICE:", e);
            }
          } else {
            console.error(`❌ Max ICE retries reached for ${targetUserId}, cleaning up...`);
            teardownAgentConnection(targetUserId);
            // Retry connection after a delay
            setTimeout(() => {
              if (agentAudioStreamRef.current && activeAgent) {
                console.log(`🔄 Retrying agent connection for ${targetUserId}...`);
                ensureAgentConnection(targetUserId);
              }
            }, 3000);
          }
        } else if (pc.iceConnectionState === "connected") {
          console.log(`✅ Agent ICE connection established for ${targetUserId}`);
          connectionRetryCount = 0; // Reset on success
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`🔌 Agent connection state for ${targetUserId}:`, pc.connectionState);

        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          console.error(`❌ Agent connection lost for ${targetUserId}, cleaning up...`);
          teardownAgentConnection(targetUserId);

          // Retry connection if agent is still active
          if (agentAudioStreamRef.current && activeAgent) {
            setTimeout(() => {
              console.log(`🔄 Retrying agent connection for ${targetUserId}...`);
              ensureAgentConnection(targetUserId);
            }, 2000);
          }
        } else if (pc.connectionState === "connected") {
          console.log(`✅ Agent connection established for ${targetUserId}`);
          connectionRetryCount = 0; // Reset on success
        }
      };

      try {
        // Create offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
        });

        // Set local description
        await pc.setLocalDescription(offer);
        console.log(`📤 Created agent offer for ${targetUserId}, waiting for ICE gathering...`);

        // 🔥 CRITICAL: Wait for ICE gathering to complete before sending offer
        await waitForIceGatheringComplete(pc);

        // Get the complete offer with all ICE candidates
        const completeOffer = pc.localDescription;
        console.log(`✅ ICE gathering complete for ${targetUserId}, sending offer...`);

        // Send offer with complete ICE candidates
        socket.emit("agent-peer-offer", {
          meetingId,
          fromUserId: "openai-agent",
          toUserId: targetUserId,
          offer: completeOffer,
          remoteName: "AI Assistant",
        });

        console.log(`📤 Sent complete agent offer to ${targetUserId}`);
      } catch (error) {
        console.error(`❌ Failed to create agent offer for ${targetUserId}:`, error);
        teardownAgentConnection(targetUserId);
      }
    },
    [meetingId, socket, teardownAgentConnection, activeAgent]
  );

  const teardownAllAgentConnections = useCallback(() => {
    Object.keys(agentPeerConnectionsRef.current).forEach(teardownAgentConnection);
  }, [teardownAgentConnection]);

  const syncAgentConnections = useCallback(() => {
    if (!activeAgent || !agentAudioStreamRef.current) return;

    remotePeers
      ?.filter((peer) => peer.userId && !peer.isAgent)
      .forEach((peer) => ensureAgentConnection(peer.userId));

    Object.keys(agentPeerConnectionsRef.current).forEach((peerId) => {
      const stillPresent = remotePeers?.some((peer) => peer.userId === peerId);
      if (!stillPresent) {
        teardownAgentConnection(peerId);
      }
    });
  }, [activeAgent, remotePeers, ensureAgentConnection, teardownAgentConnection]);

  useEffect(() => {
    syncAgentConnections();
  }, [syncAgentConnections]);


  useEffect(() => {
    if (!activeAgent) return;

    const handlePeerAgentIce = async ({ candidate, fromUserId }) => {
      if (!candidate || !fromUserId) return;
      const entry = agentPeerConnectionsRef.current[fromUserId];
      if (entry?.pc) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate for agent peer:", err);
        }
      }
    };

    const handleAgentPeerAnswer = async ({ answer, fromUserId }) => {
      if (!answer || !fromUserId) {
        return;
      }
      const entry = agentPeerConnectionsRef.current[fromUserId];
      if (!entry?.pc) return;
      try {
        if (
          entry.pc.signalingState === "have-local-offer" ||
          entry.pc.signalingState === "have-remote-offer"
        ) {
          await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`✅ Agent set remote description for ${fromUserId}`);
        }
      } catch (err) {
        console.error("Error setting remote description for agent peer:", err);
      }
    };

    socket.on("peer-agent-ice", handlePeerAgentIce);
    socket.on("agent-peer-answer", handleAgentPeerAnswer);

    return () => {
      socket.off("peer-agent-ice", handlePeerAgentIce);
      socket.off("agent-peer-answer", handleAgentPeerAnswer);
    };
  }, [activeAgent, meetingId, socket]);


  useEffect(() => {
    console.log("jointPeers", jointPeers);

    const currentKey = getCurrentKey();
    if (!currentKey || !isMeetingHost) return;

    const handleStop = () => {
      if (stopSessionRef.current) {
        stopSessionRef.current();
      }
    };

    const audioElement = document.createElement("audio");
    audioElement.autoplay = true;
    document.body.appendChild(audioElement);

    const button = document.createElement("button");
    button.innerText = "Close Session";
    button.onclick = handleStop;
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
      handleStop();
      audioElement.remove();
      button.remove();
    };
  }, [isMeetingHost, jointPeers]);



  // Add this new function before startSession
  const handleKeyExpiration = async () => {
    console.log("🔑 Handling ephemeral key expiration...");

    // Stop current session
    await stopSession();

    // Get new key
    try {
      const response = await fetch(`${socketURL}/api1/ephemeral-key`, {
        method: "POST",
      });

      const data = await response.json();
      const newKey = data.client_secret.value;
      console.log("✅ Got new ephemeral key from backend");

      // Dispatch the new key to Redux
      dispatch(setEphemeralKey(newKey));

      // ✅ Wait for Redux state to propagate and verify it's set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the key was actually set in Redux
      const verifiedKey = getCurrentKey();
      if (verifiedKey && verifiedKey === newKey) {
        console.log("✅ Verified new key is set in Redux correctly");
      } else if (!verifiedKey) {
        console.error("❌ New key not found in Redux store!");
      } else {
        console.warn("⚠️ Key mismatch - Redux key doesn't match new key");
      }

      // ✅ Reset flag and restart if still active
      sessionActiveRef.current = false;

      if (activeAgent) {
        console.log("🔄 Restarting session with new key...");
        await startSession();
      }

    } catch (err) {
      console.error("❌ Error getting new ephemeral key:", err);
      setConnectionStatus("disconnected");
    }
  };

  let connectionAttempts = 0;
  const MAX_ATTEMPTS = 5;

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

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      peerConnectionRef.current.addEventListener("connectionstatechange", () => {
        console.log("Connection state changed:", peerConnectionRef.current.connectionState);
        if (peerConnectionRef.current.connectionState === "connected") {
          setConnectionStatus("connected");
          console.log("ready to talk");
          dispatch(setAgentReady(true));

          socket.emit('openai-agent-ready', {
            meetingId: meetingId,
            ready: true
          });
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

      // peerConnectionRef.current.ontrack = async (event) => {
      //   console.log("Received track from OpenAI");
      //   const remoteStream = event.streams[0];

      //   const audioElement = document.getElementById("ai-audio");
      //   if (audioElement) {
      //     audioElement.srcObject = remoteStream;
      //   }

      //   console.log("Received audio stream from OpenAI, broadcasting to peers...");

      //   // if (jointPeers && jointPeers.current && jointPeers.current.length > 0) {
      //   //   try {
      //   //     const cleanup = await handleAiAudioStream(
      //   //       remoteStream,
      //   //       jointPeers,
      //   //       "OpenAI Assistant"
      //   //     );
      //   //     cleanupRef.current = cleanup;
      //   //     setConnectionStatus("connected");
      //   //   } catch (err) {
      //   //     console.error("Failed to broadcast OpenAI audio:", err);
      //   //   }
      //   // } else {
      //   //   console.log("No peers to broadcast to");
      //   //   setConnectionStatus("connected");
      //   // }
      // };


      // After receiving OpenAI audio track, capture and broadcast it
      peerConnectionRef.current.ontrack = async (event) => {
        console.log("Received track from OpenAI");
        const remoteStream = event.streams[0];

        const audioElement = document.getElementById("ai-audio");
        if (audioElement) {
          audioElement.srcObject = remoteStream;
        }

        agentAudioStreamRef.current = remoteStream;
        syncAgentConnections();
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

          // 🔥 Check for session errors (expired key)
          if (msg.type === "error") {
            console.error("OpenAI error:", msg);

            if (msg.error?.code === "session_expired" ||
              msg.error?.code === "invalid_api_key" ||
              msg.error?.message?.includes("expired")) {
              console.log("🔄 Session expired, refreshing key...");
              await handleKeyExpiration();
              return;
            }
          }

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



      dataChannelRef.current.addEventListener("close", () => {
        console.log("Data channel is closed");

        // 🔥 Check if it closed unexpectedly (possible key expiration)
        if (sessionActiveRef.current && activeAgent) {
          console.log("⚠️ Data channel closed unexpectedly, may be key expiration");
          setTimeout(() => {
            if (activeAgent) {
              handleKeyExpiration();
            }
          }, 1000);
        }

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
        // const model = "gpt-4o-realtime-preview-2024-12-17";
        const model = "gpt-realtime-2025-08-28";
        try {
          // ✅ Get fresh key from store each time (important for key refresh)
          const currentKey = getCurrentKey();
          if (!currentKey) {
            throw new Error("No ephemeral key available");
          }

          console.log("Sending offer to OpenAI API...");
          const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",
            body: completeOffer.sdp,
            headers: {
              Authorization: `Bearer ${currentKey}`,
              "Content-Type": "application/sdp",
            },
          });

          if (!sdpResponse.ok) {
            const errorText = await sdpResponse.text();
            console.error(`OpenAI API returned ${sdpResponse.status}: ${errorText}`);

            // 🔥 Check if it's an authentication error (expired key)
            if (sdpResponse.status === 401 || sdpResponse.status === 403) {
              console.log("🔄 Ephemeral key expired, getting new key...");
              await handleKeyExpiration();
              return; // Exit, new session will start automatically
            }
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

          // 🔥 Check if error is related to authentication
          if (error.message.includes('401') || error.message.includes('403')) {
            console.log("🔄 Detected auth error, refreshing key...");
            await handleKeyExpiration();
            return;
          }

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
    teardownAllAgentConnections();
    agentAudioStreamRef.current = null;

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

    dispatch(setAgentReady(false));

    // In stopSession function, add this before the existing emit:
    socket.emit('openai-agent-ready', {
      meetingId: meetingId,
      ready: false
    });
  };

  startSessionRef.current = startSession;
  stopSessionRef.current = stopSession;

  return null;
};

export default OpenAISession;