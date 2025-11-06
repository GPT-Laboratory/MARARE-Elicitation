import axios from "axios";
import { getSocket, socketURL } from "../socketInstance.jsx";
// import { writeFileSync } from "fs";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import {
  setActivateAgent,
  setMVP,
  setVision,
} from "../features/mainStates/MainStates_Slice.jsx";
import OpenAISession from "../OpenAISession.jsx";
import { Fetch } from "socket.io-client";

let isProcessing = false;
let processingTimeout = null;
let azureSTTRecognizer = null;

const azureConfig = {
  key: import.meta.env.VITE_AZURE_KEY,
  region: import.meta.env.VITE_AZURE_REGION,
};
let isSpeaking = false;



let lastLocalTranscript = "";
let lastLocalTimestamp = 0;
const DUPLICATE_THRESHOLD_MS = 200; // Ignore duplicates within 1 second

export const initializeAzureSTT = async (
  audioStream,
  id,
  agentName,
  setLocalTranscript,
  setLocaltranscriptView,
  localTranscript,
  jointPeers,
  remoteVideoRefs,
  setRemoteTranscript,
  remoteTranscript,
  ephemeralKey,
  activeAgent,
  dispatch
) => {
  try {
    console.log("Initializing Azure Speech-to-Text...");

    // Clean up existing recognizer before creating new one
    if (azureSTTRecognizer?.recognizer) {
      console.log("Cleaning up existing local recognizer...");
      try {
        azureSTTRecognizer.recognizer.stopContinuousRecognitionAsync();
        azureSTTRecognizer.recognizer.close();
      } catch (e) {
        console.warn("Error cleaning up existing recognizer:", e);
      }
      azureSTTRecognizer = null;
    }

    const socket = getSocket();

    // Ensure Azure Speech SDK key and region are available
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      azureConfig.key,
      azureConfig.region
    );

    if (!speechConfig) {
      throw new Error("Invalid Azure Speech Configuration");
    }

    // Use microphone input for recognition
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

    // Create a SpeechRecognizer instance
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Set up recognition event handler to log transcripts
    recognizer.recognized = async (s, e) => {
      if (e.result.text) {
        const recognizedText = e.result.text;

        // Skip empty text
        // if (!recognizedText) return;

        const currentTime = Date.now();

        console.log("recognized text:", recognizedText);
        

        // Prevent duplicate transcripts
        if (
          recognizedText === lastLocalTranscript &&
          currentTime - lastLocalTimestamp < DUPLICATE_THRESHOLD_MS
        ) {
          console.log("Duplicate local transcript detected, skipping:", recognizedText);
          return;
        }

        // Update last transcript tracking
        lastLocalTranscript = recognizedText;
        lastLocalTimestamp = currentTime;

        console.log(`Local Peer: in  ${recognizedText}`);
        socket.emit("localtranscript in helper", { text: recognizedText });

        setLocalTranscript((prevTranscript) => {
          // Additional check to prevent duplicates in state
          if (prevTranscript[prevTranscript.length - 1] === recognizedText) {
            return prevTranscript;
          }
          return [...prevTranscript, recognizedText];
        });

        setLocaltranscriptView((prevTranscript) => {
          // Store as objects with text and timestamp
          const newTranscript = { text: recognizedText, timestamp: currentTime };

          if (prevTranscript.length > 0 &&
            prevTranscript[prevTranscript.length - 1].text === recognizedText) {
            return prevTranscript;
          }
          return [...prevTranscript, newTranscript];
        });

        console.log("agentName", agentName);

        const lowerText = recognizedText.toLowerCase();
        const includesStopCommand = lowerText.includes("stop");
        // const includesAgentName = recognizedText
        const includesAgentName = recognizedText
          .toLowerCase()
          .includes(agentName.toLowerCase());

        // .includes(agentName.toLowerCase());

        // Proper way to stop speech
        if (includesStopCommand) {
          console.log("stopping command");

          // Actually stop the speech synthesis
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }

          // Reset the flag
          isSpeaking = false;

          // Optional: Add confirmation
          console.log("Speech stopped and flag reset");
        }

        if (includesStopCommand) {
          dispatch(setActivateAgent(false));
          console.log("Deactivated agent on 'stop now' command");
        }

        // Process recognized text for remote stream
        if (includesAgentName) {
          console.log("Ephemeral key", ephemeralKey);
          console.log("active agent", activeAgent);
          dispatch(setActivateAgent(true));
          console.log("working this time");
        }
      }
    };

    // Store recognizer in global azureSTTRecognizer object
    azureSTTRecognizer = {
      recognizer,
      speechConfig,
    };

    // Start continuous recognition
    await new Promise((resolve, reject) => {
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log(
            "Azure Speech-to-Text initialized successfully. Listening..."
          );
          resolve();
        },
        (err) => {
          console.error("Error starting continuous recognition:", err);
          reject(err);
        }
      );
    });
  } catch (error) {
    console.error("Error initializing Azure STT:", error);
    throw error;
  }
};

const azureSTTRecognizers = {};
const processedRemotePeers = new Set(); // Track which peers we've already processed
const remoteTranscriptTracking = {}; // Track last transcript per user

export const processRemoteStream = async (
  remotePeers,
  remoteVideoRefs,
  setRemoteTranscript,
  setRemotetranscriptView,
  remoteTranscript
) => {
  try {
    console.log("Processing remote audio streams...", remotePeers);

    if (!azureSTTRecognizer) {
      throw new Error(
        "Azure STT not initialized. Call initializeAzureSTT() first."
      );
    }

    // Helper function to handle remote stream + STT
    const handleRemoteStream = async (userId, remoteName, stream, track) => {
      console.log("stream comes for", userId, remoteName, stream);

      // Attach to video element for playback
      const videoEl = remoteVideoRefs?.current?.[userId];
      if (videoEl && !videoEl.srcObject) {
        videoEl.srcObject = stream;
        console.log(`Attached remote stream to video for ${userId}`);
      }

      // Only process audio tracks for STT
      if (track.kind === "audio") {
        console.log(`Got remote audio track for ${userId}:`, track);

        if (track.enabled) {
          // Check if we already have a recognizer for this user
          if (azureSTTRecognizers[userId]) {
            console.log(`Recognizer already exists for ${userId}, skipping...`);
            return;
          }

          const remoteMediaStream = new MediaStream([track]);
          console.log(`Remote media stream working for ${userId}:`, remoteMediaStream);

          // Create audio config for this user
          const audioConfig = sdk.AudioConfig.fromStreamInput(remoteMediaStream);

          // Create recognizer for this user
          const recognizer = new sdk.SpeechRecognizer(
            azureSTTRecognizer.speechConfig,
            audioConfig
          );

          azureSTTRecognizers[userId] = recognizer;

          // Initialize tracking for this user
          if (!remoteTranscriptTracking[userId]) {
            remoteTranscriptTracking[userId] = {
              lastText: "",
              lastTimestamp: 0
            };
          }

          // Recognition handler
          recognizer.recognized = (s, e) => {
            if (e.result.text) {
              const recognizedText = e.result.text.trim();
              console.log("recognizer text", recognizedText);
              
              // Skip empty text
              if (!recognizedText) return;

              const currentTime = Date.now();
              const userTracking = remoteTranscriptTracking[userId];

              // Prevent duplicates for this specific user
              if (
                recognizedText === userTracking.lastText &&
                currentTime - userTracking.lastTimestamp < DUPLICATE_THRESHOLD_MS
              ) {
                console.log(`Duplicate remote transcript detected for ${remoteName}, skipping:`, recognizedText);
                return;
              }

              // Update tracking
              userTracking.lastText = recognizedText;
              userTracking.lastTimestamp = currentTime;

              console.log(`Remote Voice (${remoteName}): ${recognizedText}`);
              console.log("remoteTranscript in helper", remoteTranscript);

              setRemoteTranscript((prev) => {
                const prevArr = prev[remoteName] || [];

                // Check for duplicate in state
                if (prevArr[prevArr.length - 1] === recognizedText) {
                  console.log(`Duplicate in state for ${remoteName}, skipping`);
                  return prev;
                }

                return { ...prev, [remoteName]: [...prevArr, recognizedText] };
              });

              setRemotetranscriptView((prev) => {
                const prevArr = prev[remoteName] || [];

                // Store as objects with text and timestamp
                const newTranscript = { text: recognizedText, timestamp: currentTime };

                if (prevArr.length > 0 && prevArr[prevArr.length - 1].text === recognizedText) {
                  console.log(`Duplicate in state for ${remoteName}, skipping`);
                  return prev;
                }

                return { ...prev, [remoteName]: [...prevArr, newTranscript] };
              });

              if (recognizedText.toLowerCase().includes("agent")) {
                console.log(
                  `Agent detected in transcript for ${remoteName}:`,
                  recognizedText
                );
              }
            }
          };

          // Start recognition
          await new Promise((resolve, reject) => {
            recognizer.startContinuousRecognitionAsync(
              () => {
                console.log(
                  `Continuous Recognition Started for remote voice (${remoteName})`
                );
                resolve();
              },
              (err) => {
                console.error(`Error starting recognition for ${userId}:`, err);
                reject(err);
              }
            );
          });
        } else {
          console.warn(`Audio track is disabled for user: ${remoteName}`);
        }
      }
    };

    // Loop through all peers
    Object.entries(remotePeers).forEach(([userId, peer]) => {
      const pc = peer?.pc;
      console.log("pc comes", pc);

      const remoteName = peer?.remoteName || "remote user";

      if (!pc) {
        console.warn(`No RTCPeerConnection found for user: ${userId}`);
        return;
      }

      // Check if we've already processed this peer
      const peerId = `${userId}-${remoteName}`;
      // if (processedRemotePeers.has(peerId)) {
      //   console.log(`Peer ${peerId} already processed, skipping...`);
      //   return;
      // }

      processedRemotePeers.add(peerId);

      // 🔴 Handle future tracks - Only set once
      if (!pc.ontrackSet) {
        pc.ontrack = async (event) => {
          const stream = event.streams[0];
          await handleRemoteStream(userId, remoteName, stream, event.track);
        };
        pc.ontrackSet = true; // Mark that we've set the handler
      }

      // 🔴 Handle already existing tracks
      pc.getReceivers().forEach((receiver) => {
        if (receiver.track) {
          const stream = new MediaStream([receiver.track]);
          handleRemoteStream(userId, remoteName, stream, receiver.track);
        }
      });
    });
  } catch (error) {
    console.error("Error processing remote streams:", error);
  }
};



export const stopAllSTTRecognizers = () => {
  try {
    // Stop local recognizer
    if (azureSTTRecognizer?.recognizer) {
      azureSTTRecognizer.recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log("Local Azure STT stopped successfully");
        },
        (err) => {
          console.error("Error stopping local Azure STT:", err);
        }
      );

      // Clean up local recognizer
      azureSTTRecognizer.recognizer.close();
      azureSTTRecognizer = null;
    }

    // Stop all remote recognizers
    Object.entries(azureSTTRecognizers).forEach(([userId, recognizer]) => {
      if (recognizer) {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            console.log(`Remote Azure STT stopped for user: ${userId}`);
          },
          (err) => {
            console.error(`Error stopping remote Azure STT for ${userId}:`, err);
          }
        );

        // Clean up remote recognizer
        recognizer.close();
      }
    });

    // Clear all remote recognizers
    Object.keys(azureSTTRecognizers).forEach(key => {
      delete azureSTTRecognizers[key];
    });

    console.log("All STT recognizers stopped and cleaned up");
  } catch (error) {
    console.error("Error stopping STT recognizers:", error);
  }
};

const cleanupAzureSTT = async () => {
  if (azureSTTRecognizer?.recognizer) {
    azureSTTRecognizer.recognizer.close();
    azureSTTRecognizer.recognizer = null;
  }
  azureSTTRecognizer = null;
  console.log("Azure STT cleaned up.");
};

const stopAzureSTT = (recognizer) => {
  if (recognizer) {
    recognizer.stopContinuousRecognitionAsync(
      () => console.log("Recognition stopped"),
      (err) => console.error("Error stopping recognition:", err)
    );
  }
};

const sendToOpenAI = async (text, recognizer) => {
  // If already processing, return early
  if (isProcessing) {
    console.log("Already processing a request, skipping...");
    return;
  }

  isProcessing = true;
  stopAzureSTT(recognizer);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a real-time meeting assistant available during live calls. Your primary role is to respond accurately and concisely to questions or discussions related to the ongoing meeting. Use the context provided in the user's question to give relevant and actionable answers. You can use your general intelligence to provide clear, helpful, and well-informed responses, even for topics that may not be directly related to the meeting and response must be in 50 tokens  ",
          },
          { role: "user", content: text },
        ],
        max_tokens: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "openai generated response : ",
      response.data.choices[0].message.content
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error sending text to OpenAI:", error);
    throw error;
  } finally {
    // Reset the processing flag after a delay
    setTimeout(() => {
      isProcessing = false;
    }, 5000); // 5 second cooldown
  }
};

// Add this function to handle the recognition event
export const handleRecognition = (
  text,
  recognizer,
  audioStream,
  type,
  agentName,
  setLocalTranscript,
  localTranscript,
  jointPeers,
  remoteVideoRefs,
  setRemoteTranscript,
  remoteTranscript,
) => {
  // If already processing, return early
  if (isProcessing) {
    console.log("Already processing a request, skipping...");
    return;
  }

  // Clear any existing timeout
  if (processingTimeout) {
    clearTimeout(processingTimeout);
  }

  // Set a new timeout to process the recognition
  processingTimeout = setTimeout(async () => {
    const response = await sendToOpenAI(text, recognizer);
    if (response) {
      // convertTextToSpeech(
      //   response,
      // );
    }
  }, 100); // Wait 0.1 second before processing to avoid multiple calls
};

export const sendTranscriptsToBackend = async (
  localTranscript,
  remoteTranscript,
  agenda,
  meetingType,
  dispatch
) => {
  try {
    console.log("bla", localTranscript, remoteTranscript);

    const response = await axios.post(`${socketURL}/leaveCall`, {
      localTranscript,
      remoteTranscript,
      agenda,
      meetingType,
    });

    if (response.status === 200) {
      const { pdfContent, fileName, mvpDocument, visionDocument } =
        response.data;

      // 🔥 Dispatch to Redux
      dispatch(setMVP(mvpDocument));
      dispatch(setVision(visionDocument));

      // Decode the base64 content to create a downloadable PDF
      const blob = new Blob(
        [Uint8Array.from(atob(pdfContent), (c) => c.charCodeAt(0))],
        {
          type: "application/pdf",
        }
      );

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();

      console.log("PDF downloaded successfully.");
    } else {
      console.error("Failed to generate the PDF:", response.data.error);
    }
  } catch (error) {
    console.error("Error sending transcripts to backend:", error);
  }
};


