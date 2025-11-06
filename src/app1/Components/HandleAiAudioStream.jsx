


// export const handleAiAudioStream = async (
//   aiAudioStream, // The audio stream from OpenAI
//   jointPeers, // Your connected peers ref object
//   agentName = "OpenAI Assistant" // Name of the AI agent
// ) => {
//   try {
//     console.log(`Broadcasting ${agentName} audio to all peers`);
//     console.log("jointPeers in audiostream", jointPeers);
//     console.log("AI audio stream received:", aiAudioStream);

//     // Validate incoming stream
//     if (!aiAudioStream || !aiAudioStream.getAudioTracks || !aiAudioStream.getAudioTracks().length) {
//       console.error("Invalid AI audio stream received");
//       return () => { }; // Return empty cleanup function
//     }

//     // Store original tracks for each peer to restore later
//     const originalTracks = new Map();

//     // Create audio context
//     const audioContext = new (window.AudioContext || window.webkitAudioContext)();

//     // Create an audio element for monitoring playback
//     const aiAudioElement = document.createElement('audio');
//     aiAudioElement.srcObject = aiAudioStream;
//     aiAudioElement.autoplay = true;
//     aiAudioElement.style.display = 'none';
//     document.body.appendChild(aiAudioElement);

//     // Add audio volume meter to detect activity in the AI audio stream
//     const aiTrack = aiAudioStream.getAudioTracks()[0];

//     // Ensure the AI track is enabled and active
//     aiTrack.enabled = true;
//     console.log("AI Track state:", aiTrack.readyState, "enabled:", aiTrack.enabled);

//     const aiSource = audioContext.createMediaStreamSource(new MediaStream([aiTrack]));
//     const analyser = audioContext.createAnalyser();
//     analyser.fftSize = 256;
//     aiSource.connect(analyser);

//     // Storage for data channels
//     const dataChannels = {};

//     // Track known peer IDs to detect new peers
//     const knownPeers = new Set();

//     // add new function to copy detection script
//     const detectAiAgentActivation = () => {
//       let isAiActive = false;
//       let activationCheckInterval;

//       const checkAiActivation = () => {
//         analyser.getByteFrequencyData(dataArray);

//         // Calculate volume level
//         let sum = 0;
//         for (let i = 0; i < dataArray.length; i++) {
//           sum += dataArray[i];
//         }
//         const average = sum / dataArray.length;
//         const volumePercent = Math.min(100, Math.max(0, average * 2));

//         // If AI starts speaking and wasn't active before
//         if (volumePercent > 20 && !isAiActive) {
//           console.log("🎤 AI AGENT ACTIVATED - Broadcasting to all existing peers");
//           isAiActive = true;

//           // Broadcast to ALL current peers (not just new ones)
//           broadcastToAllPeers().catch(err => {
//             console.error("Error broadcasting to existing peers on AI activation:", err);
//           });

//           // Update UI to show activation
//           const autoBroadcastStatus = document.getElementById('auto-broadcast-status');
//           if (autoBroadcastStatus) {
//             autoBroadcastStatus.style.backgroundColor = 'rgba(0,255,0,0.8)';
//             autoBroadcastStatus.innerHTML = '<div>Auto-Broadcast: AI ACTIVE</div><div>Broadcasting to all peers...</div>';
//           }
//         }

//         // Reset activation flag after extended silence
//         if (volumePercent < 5 && isAiActive) {
//           silenceCounter++;
//           if (silenceCounter > 60) { // 2 seconds of silence
//             isAiActive = false;
//             silenceCounter = 0;
//             console.log("AI agent deactivated");

//             // Update UI
//             const autoBroadcastStatus = document.getElementById('auto-broadcast-status');
//             if (autoBroadcastStatus) {
//               autoBroadcastStatus.style.backgroundColor = 'rgba(0,128,0,0.7)';
//               autoBroadcastStatus.innerHTML = '<div>Auto-Broadcast: STANDBY</div><div>Waiting for AI activation...</div>';
//             }
//           }
//         } else if (volumePercent > 5) {
//           silenceCounter = 0;
//         }
//       };

//       // Check every 100ms for faster response
//       activationCheckInterval = setInterval(checkAiActivation, 100);

//       return () => {
//         if (activationCheckInterval) {
//           clearInterval(activationCheckInterval);
//         }
//       };
//     };

//     // close function to copy detection script

//     // Create UI elements for monitoring
//     const createMonitoringUI = () => {
//       // Create a volume monitor for the AI voice
//       const volumeMonitor = document.createElement('div');
//       volumeMonitor.id = 'ai-voice-monitor';
//       volumeMonitor.style.position = 'fixed';
//       volumeMonitor.style.bottom = '100px';
//       volumeMonitor.style.right = '10px';
//       volumeMonitor.style.backgroundColor = 'rgba(0,0,0,0.7)';
//       volumeMonitor.style.color = 'white';
//       volumeMonitor.style.padding = '10px';
//       volumeMonitor.style.borderRadius = '5px';
//       volumeMonitor.style.zIndex = '1000';
//       volumeMonitor.style.display = 'none'; // Initially hidden
//       volumeMonitor.innerHTML = `<div>AI Voice Activity</div>
//                                 <div id="volume-meter" style="width: 200px; height: 20px; background-color: #333; border-radius: 10px; overflow: hidden;">
//                                   <div id="volume-level" style="width: 0%; height: 100%; background-color: green;"></div>
//                                 </div>
//                                 <div id="voice-status">Status: Monitoring...</div>`;
//       document.body.appendChild(volumeMonitor);

//       // Track the broadcast status for each peer
//       const peerStatusDiv = document.createElement('div');
//       peerStatusDiv.id = 'peer-broadcast-status';
//       peerStatusDiv.style.position = 'fixed';
//       peerStatusDiv.style.bottom = '170px';
//       peerStatusDiv.style.right = '10px';
//       peerStatusDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
//       peerStatusDiv.style.color = 'white';
//       peerStatusDiv.style.padding = '10px';
//       peerStatusDiv.style.borderRadius = '5px';
//       peerStatusDiv.style.zIndex = '1000';
//       peerStatusDiv.style.display = 'none';
//       peerStatusDiv.innerHTML = '<div>Remote Peer Status</div><div id="peer-list"></div>';
//       document.body.appendChild(peerStatusDiv);

//       // Add auto-broadcast status indicator
//       const autoBroadcastStatus = document.createElement('div');
//       autoBroadcastStatus.id = 'auto-broadcast-status';
//       autoBroadcastStatus.style.position = 'fixed';
//       autoBroadcastStatus.style.bottom = '240px';
//       autoBroadcastStatus.style.right = '10px';
//       autoBroadcastStatus.style.backgroundColor = 'rgba(0,128,0,0.7)';
//       autoBroadcastStatus.style.color = 'white';
//       autoBroadcastStatus.style.padding = '10px';
//       autoBroadcastStatus.style.borderRadius = '5px';
//       autoBroadcastStatus.style.zIndex = '1000';
//       autoBroadcastStatus.style.display = 'none'; // Initially visible
//       autoBroadcastStatus.innerHTML = '<div>Auto-Broadcast: ACTIVE</div><div id="new-peer-count">New peers detected: 0</div>';
//       document.body.appendChild(autoBroadcastStatus);
//     };

//     createMonitoringUI();

//     // Function to update the volume meter
//     const dataArray = new Uint8Array(analyser.frequencyBinCount);
//     let volumeMonitorAnimationFrame;

//     const updateVolumeMeter = () => {
//       analyser.getByteFrequencyData(dataArray);

//       // Calculate volume level (simple average)
//       let sum = 0;
//       for (let i = 0; i < dataArray.length; i++) {
//         sum += dataArray[i];
//       }
//       const average = sum / dataArray.length;
//       const volumePercent = Math.min(100, Math.max(0, average * 2)); // Scale for better visualization

//       // Update the volume meter
//       const volumeLevel = document.getElementById('volume-level');
//       if (volumeLevel) {
//         volumeLevel.style.width = `${volumePercent}%`;
//         volumeLevel.style.backgroundColor = volumePercent > 20 ? 'green' : '#333';
//       }

//       const voiceStatus = document.getElementById('voice-status');
//       if (voiceStatus) {
//         voiceStatus.textContent = `Status: ${volumePercent > 20 ? 'Voice Detected' : 'Silent'}`;

//         // If voice is detected, send notification to all peers
//         if (volumePercent > 20) {
//           Object.values(dataChannels).forEach(channel => {
//             if (channel && channel.readyState === 'open') {
//               try {
//                 channel.send(JSON.stringify({
//                   type: 'voice-detection',
//                   volume: volumePercent,
//                   agentName: agentName
//                 }));
//               } catch (err) {
//                 console.warn("Error sending voice detection:", err);
//               }
//             }
//           });
//         }
//       }

//       // Continue monitoring
//       volumeMonitorAnimationFrame = requestAnimationFrame(updateVolumeMeter);
//     };

//     // Start monitoring
//     updateVolumeMeter();

//     // Function to update peer status in the UI
//     const updatePeerStatus = (peerId, status) => {
//       const peerList = document.getElementById('peer-list');
//       if (!peerList) return;

//       let peerElement = document.getElementById(`peer-${peerId}`);
//       if (!peerElement) {
//         peerElement = document.createElement('div');
//         peerElement.id = `peer-${peerId}`;
//         peerList.appendChild(peerElement);
//       }

//       // Determine color based on status
//       let statusColor = 'orange';
//       if (status === 'broadcasting') statusColor = 'green';
//       else if (status.startsWith('error')) statusColor = 'red';

//       peerElement.innerHTML = `<div style="margin: 5px 0; padding: 5px; border-radius: 3px; background-color: rgba(0,0,0,0.3);">
//         <span>Peer ${peerId.substring(0, 8)}...</span>
//         <span style="color: ${statusColor}; margin-left: 10px;">${status}</span>
//       </div>`;
//     };

//     // Function to update auto-broadcast status
//     const updateAutoBroadcastStatus = (newPeerCount) => {
//       const newPeerCountElement = document.getElementById('new-peer-count');
//       if (newPeerCountElement) {
//         newPeerCountElement.textContent = `New peers detected: ${newPeerCount}`;
//       }
//     };

//     // Create a button to manually test broadcasting
//     const createTestButton = () => {
//       const testButton = document.createElement('button');
//       testButton.innerText = 'Test Audio Broadcast';
//       testButton.style.position = 'fixed';
//       testButton.style.bottom = '320px';
//       testButton.style.right = '10px';
//       testButton.style.zIndex = '1000';
//       testButton.style.padding = '10px 20px';
//       testButton.style.backgroundColor = '#ff7700';
//       testButton.style.color = '#fff';
//       testButton.style.border = 'none';
//       testButton.style.borderRadius = '5px';
//       testButton.style.cursor = 'pointer';
//       testButton.style.display = 'none'; // Initially hidden
//       testButton.onclick = () => {
//         broadcastToAllPeers();
//       };
//       document.body.appendChild(testButton);

//       return testButton;
//     };

//     const testButton = createTestButton();

//     // Enhanced function to create and send an audio stream with AI audio to a peer
//     const broadcastToPeer = async (peer) => {
//       if (!peer?.pc || peer.pc.connectionState === "closed" || peer.pc.connectionState === "failed") {
//         console.warn(`Skipping invalid or closed peer: ${peer?.userId}`);
//         updatePeerStatus(peer.userId, 'disconnected');
//         return;
//       }

//       try {
//         updatePeerStatus(peer.userId, 'preparing');

//         // Create a data channel for voice verification if it doesn't exist
//         if (!dataChannels[peer.userId]) {
//           try {
//             const channelId = Math.floor(Math.random() * 65535);
//             dataChannels[peer.userId] = peer.pc.createDataChannel(`voice-verification-${channelId}`, {
//               ordered: true
//             });

//             dataChannels[peer.userId].onopen = () => {
//               console.log(`Data channel opened for peer ${peer.userId}`);
//               updatePeerStatus(peer.userId, 'data-channel-open');

//               // Send initial message to test channel
//               dataChannels[peer.userId].send(JSON.stringify({
//                 type: 'connection-test',
//                 agentName: agentName,
//                 timestamp: Date.now()
//               }));
//             };

//             dataChannels[peer.userId].onclose = () => {
//               console.log(`Data channel closed for peer ${peer.userId}`);
//               updatePeerStatus(peer.userId, 'data-channel-closed');
//             };

//             dataChannels[peer.userId].onerror = (err) => {
//               console.error(`Data channel error for peer ${peer.userId}:`, err);
//             };
//           } catch (err) {
//             console.warn(`Could not create data channel for peer ${peer.userId}:`, err);
//           }
//         }

//         // Find existing audio sender
//         const existingSender = peer.pc
//           .getSenders()
//           .find((s) => s.track?.kind === "audio");

//         if (existingSender && existingSender.track) {
//           // Store the original track if not already stored
//           if (!originalTracks.has(peer.userId)) {
//             originalTracks.set(peer.userId, existingSender.track.clone());
//             console.log(`Stored original track for peer ${peer.userId}`);
//           }

//           updatePeerStatus(peer.userId, 'creating-mixed-track');

//           // Create a new audio context for this specific peer
//           const peerAudioContext = new (window.AudioContext || window.webkitAudioContext)();

//           // Create a destination for the mixed audio
//           const mixedDestination = peerAudioContext.createMediaStreamDestination();

//           // Add both streams to the destination
//           // 1. Add AI audio stream
//           const aiSourceTrack = aiAudioStream.getAudioTracks()[0];
//           if (aiSourceTrack && aiSourceTrack.readyState === 'live') {
//             const aiSource = peerAudioContext.createMediaStreamSource(
//               new MediaStream([aiSourceTrack])
//             );

//             // Add some gain to the AI voice
//             const aiGain = peerAudioContext.createGain();
//             aiGain.gain.value = 1.2; // Boost AI volume
//             aiSource.connect(aiGain);
//             aiGain.connect(mixedDestination);
//             console.log(`Connected AI audio to mixed destination for peer ${peer.userId}`);
//           } else {
//             console.warn(`AI audio track is not live for peer ${peer.userId}`);
//             updatePeerStatus(peer.userId, 'ai-track-not-live');
//           }

//           // 2. Add original user audio but at lower volume
//           try {
//             const originalTrack = originalTracks.get(peer.userId);
//             if (originalTrack && originalTrack.readyState === 'live') {
//               const userSource = peerAudioContext.createMediaStreamSource(
//                 new MediaStream([originalTrack])
//               );

//               // Lower gain for user's voice to avoid feedback
//               const userGain = peerAudioContext.createGain();
//               userGain.gain.value = 0.6; // Reduce user volume
//               userSource.connect(userGain);
//               userGain.connect(mixedDestination);
//               console.log(`Connected user audio to mixed destination for peer ${peer.userId}`);
//             }
//           } catch (err) {
//             console.warn(`Error connecting original user audio for peer ${peer.userId}:`, err);
//           }

//           // Get the mixed track
//           const mixedTrack = mixedDestination.stream.getAudioTracks()[0];

//           if (mixedTrack) {
//             // Make sure mixed track is enabled
//             mixedTrack.enabled = true;

//             // Replace the track with our mixed stream
//             console.log(`Replacing track for peer ${peer.userId}`);
//             await existingSender.replaceTrack(mixedTrack);
//             updatePeerStatus(peer.userId, 'track-replaced');

//             // Store the context and destination for cleanup
//             peer.audioContext = peerAudioContext;
//             peer.mixedDestination = mixedDestination;

//             // Store the mixed track reference
//             peer.mixedTrack = mixedTrack;

//             console.log(`Successfully replaced track for peer ${peer.userId}`);

//             // Let's also update the connection to ensure the change is propagated
//             if (peer.pc.signalingState === "stable") {
//               try {
//                 updatePeerStatus(peer.userId, 'creating-offer');
//                 const offer = await peer.pc.createOffer({
//                   offerToReceiveAudio: true,
//                   offerToReceiveVideo: true
//                 });

//                 await peer.pc.setLocalDescription(offer);
//                 updatePeerStatus(peer.userId, 'offer-created');

//                 // Send the offer via the appropriate method
//                 if (typeof peer.sendOffer === "function") {
//                   await peer.sendOffer(peer.userId, offer);
//                   updatePeerStatus(peer.userId, 'offer-sent');
//                 } else if (typeof window.sendOfferToPeer === "function") {
//                   await window.sendOfferToPeer(peer.userId, offer);
//                   updatePeerStatus(peer.userId, 'offer-sent');
//                 } else {
//                   console.warn(`No method to send offer to peer ${peer.userId}`);
//                   updatePeerStatus(peer.userId, 'no-send-offer-method');
//                 }
//               } catch (offerErr) {
//                 console.error(`Failed to create/send offer for peer ${peer.userId}:`, offerErr);
//                 updatePeerStatus(peer.userId, `offer-error: ${offerErr.message}`);
//               }
//             } else {
//               console.log(`Skipping offer creation for peer ${peer.userId} as signaling state is ${peer.pc.signalingState}`);
//               updatePeerStatus(peer.userId, `signaling-state: ${peer.pc.signalingState}`);
//             }

//             // Send a message to the remote peer to notify about voice transmission
//             if (dataChannels[peer.userId] && dataChannels[peer.userId].readyState === 'open') {
//               try {
//                 dataChannels[peer.userId].send(JSON.stringify({
//                   type: 'voice-start',
//                   agentName: agentName,
//                   timestamp: Date.now()
//                 }));
//                 updatePeerStatus(peer.userId, 'broadcasting');
//               } catch (msgErr) {
//                 console.warn(`Error sending voice-start message to peer ${peer.userId}:`, msgErr);
//               }
//             } else {
//               console.log(`Data channel not open for peer ${peer.userId}`);
//               updatePeerStatus(peer.userId, 'broadcasting-no-data-channel');
//             }
//           } else {
//             console.error(`Failed to get mixed track for peer ${peer.userId}`);
//             updatePeerStatus(peer.userId, 'no-mixed-track');
//           }
//         } else {
//           console.warn(`No audio sender found for peer ${peer.userId}`);
//           updatePeerStatus(peer.userId, 'no-audio-sender');
//         }
//       } catch (error) {
//         console.error(`Failed to broadcast AI audio to peer ${peer.userId}:`, error);
//         updatePeerStatus(peer.userId, `error: ${error.message}`);
//       }
//     };


//     // Function to broadcast to all peers
//     // Updated broadcastToAllPeers function with better error handling
//     const broadcastToAllPeers = async () => {
//       if (jointPeers?.current && jointPeers.current.length > 0) {
//         console.log(`🔊 Broadcasting AI audio to ${jointPeers.current.length} peers`);

//         // Get all valid peers
//         const validPeers = jointPeers.current.filter(peer =>
//           peer &&
//           peer.userId &&
//           peer.pc &&
//           peer.pc.connectionState !== "closed" &&
//           peer.pc.connectionState !== "failed"
//         );

//         console.log(`Found ${validPeers.length} valid peers for broadcasting`);

//         // Process each peer
//         const broadcastPromises = validPeers.map(async (peer) => {
//           try {
//             console.log(`Broadcasting to peer ${peer.userId} (state: ${peer.pc.connectionState})`);
//             await broadcastToPeer(peer);
//             console.log(`✅ Successfully broadcasted to peer ${peer.userId}`);
//           } catch (err) {
//             console.error(`❌ Failed to broadcast to peer ${peer.userId}:`, err);
//             updatePeerStatus(peer.userId, `broadcast-error: ${err.message}`);
//           }
//         });

//         // Wait for all broadcasts to complete
//         await Promise.allSettled(broadcastPromises);
//         console.log(`Completed broadcasting to all peers`);

//       } else {
//         console.warn("No joint peers found to broadcast AI audio to");
//       }
//     };
//     // closed function to broadcast to all peers

//     // Function to broadcast to a specific new peer
//     const broadcastToNewPeer = async (newPeer) => {
//       console.log(`Auto-broadcasting to new peer: ${newPeer.userId}`);

//       // Wait a bit for the peer connection to stabilize
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Check if the peer connection is ready
//       if (newPeer.pc && newPeer.pc.connectionState === 'connected') {
//         await broadcastToPeer(newPeer);
//       } else {
//         console.log(`Waiting for peer ${newPeer.userId} connection to stabilize...`);

//         // Wait up to 10 seconds for connection to be ready
//         let attempts = 0;
//         const maxAttempts = 20; // 10 seconds with 500ms intervals

//         const waitForConnection = async () => {
//           if (attempts >= maxAttempts) {
//             console.warn(`Timeout waiting for peer ${newPeer.userId} connection`);
//             return;
//           }

//           if (newPeer.pc && (newPeer.pc.connectionState === 'connected' || newPeer.pc.connectionState === 'connecting')) {
//             await broadcastToPeer(newPeer);
//           } else {
//             attempts++;
//             setTimeout(waitForConnection, 500);
//           }
//         };

//         waitForConnection();
//       }
//     };

//     // NEW: Monitor for new peers joining
//     let newPeerCount = 0;

//     const monitorNewPeers = () => {
//       if (jointPeers?.current) {
//         // Get current peer IDs
//         const currentPeerIds = new Set(
//           jointPeers.current
//             .filter(peer => peer && peer.userId)
//             .map(peer => peer.userId)
//         );

//         // Find new peers that weren't there before
//         const newPeers = jointPeers.current.filter(peer =>
//           peer && peer.userId && !knownPeers.has(peer.userId)
//         );

//         if (newPeers.length > 0) {
//           console.log(`🎯 NEW PEERS DETECTED: ${newPeers.length} new peer(s)`);
//           newPeerCount += newPeers.length;
//           updateAutoBroadcastStatus(newPeerCount);

//           // Add new peers to known peers set
//           newPeers.forEach(peer => {
//             knownPeers.add(peer.userId);
//             console.log(`Added new peer to monitoring: ${peer.userId}`);

//             // Auto-broadcast to this new peer
//             broadcastToNewPeer(peer).catch(err => {
//               console.error(`Error auto-broadcasting to new peer ${peer.userId}:`, err);
//             });
//           });
//         }

//         // Handle peers that might have left
//         const leftPeers = Array.from(knownPeers).filter(knownPeerId =>
//           !currentPeerIds.has(knownPeerId)
//         );

//         leftPeers.forEach(leftPeerId => {
//           console.log(`Peer left: ${leftPeerId}`);
//           knownPeers.delete(leftPeerId);

//           // Clean up UI element for left peer
//           const peerElement = document.getElementById(`peer-${leftPeerId}`);
//           if (peerElement) {
//             peerElement.remove();
//           }
//         });
//       }

//       // Continue monitoring every 2 seconds
//       setTimeout(monitorNewPeers, 2000);
//     };
//     // closed function to monitor new peers

//     // Initialize known peers with current peers
//     if (jointPeers?.current) {
//       jointPeers.current.forEach(peer => {
//         if (peer && peer.userId) {
//           knownPeers.add(peer.userId);
//         }
//       });
//       console.log(`Initialized with ${knownPeers.size} existing peers`);
//     }

//     // Start monitoring for new peers
//     monitorNewPeers();

//     // Start AI activation detection (ADD THIS NEW LINE)
//     const stopAiActivationDetection = detectAiAgentActivation();

//     // Setup remote peer detection (keeping original function stub)
//     const setupRemotePeerDetection = () => {
//       // Original function - can be expanded if needed
//     };

//     // Setup remote peer detection
//     setupRemotePeerDetection();

//     // First broadcast attempt to existing peers
//     await broadcastToAllPeers();




//     // Add a listener to detect when AI stops speaking
//     let silenceCounter = 0;
//     const silenceThreshold = 150; // 5 seconds of silence (30 frames per second)

//     const checkForSilence = () => {
//       analyser.getByteFrequencyData(dataArray);

//       // Calculate volume level (simple average)
//       let sum = 0;
//       for (let i = 0; i < dataArray.length; i++) {
//         sum += dataArray[i];
//       }
//       const average = sum / dataArray.length;
//       const volumePercent = Math.min(100, Math.max(0, average * 2));

//       // If volume is very low, increment silence counter
//       if (volumePercent < 5) {
//         silenceCounter++;
//       } else {
//         silenceCounter = 0; // Reset counter if sound detected
//       }

//       // If silence persists for the threshold duration, stop broadcasting
//       if (silenceCounter > silenceThreshold) {
//         console.log("Extended silence detected, stopping AI broadcast");

//         return; // Stop checking
//       }

//       // Continue checking for silence
//       setTimeout(checkForSilence, 33); // About 30 checks per second
//     };

//     // Start silence detection
//     checkForSilence();

//     // Return cleanup function


//   } catch (error) {
//     console.error("Failed to broadcast AI audio:", error);

//     // Clean up UI elements even in case of error
//     const elementsToRemove = [
//       'ai-voice-monitor',
//       'peer-broadcast-status',
//       'auto-broadcast-status',
//       'copy-detection-script-button'
//     ];

//     elementsToRemove.forEach(id => {
//       const element = document.getElementById(id);
//       if (element) element.remove();
//     });

//     // Return empty cleanup function
//     return () => { };
//   }
// };

































export const handleAiAudioStream = async (
  aiAudioStream,
  jointPeers,
  agentName = "OpenAI Assistant"
) => {
  try {
    console.log(`Broadcasting ${agentName} audio to all peers`);

    if (!aiAudioStream || !aiAudioStream.getAudioTracks || !aiAudioStream.getAudioTracks().length) {
      console.error("Invalid AI audio stream received");
      return () => { };
    }

    const originalTracks = new Map();

    // Create ONE shared AudioContext
    const sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive',
      sampleRate: 48000
    });

    // Create ONE shared source for AI audio
    const aiTrack = aiAudioStream.getAudioTracks()[0];
    aiTrack.enabled = true;
    
    const sharedAiSource = sharedAudioContext.createMediaStreamSource(
      new MediaStream([aiTrack])
    );

    // Monitoring setup
    const aiAudioElement = document.createElement('audio');
    aiAudioElement.srcObject = aiAudioStream;
    aiAudioElement.autoplay = true;
    aiAudioElement.style.display = 'none';
    document.body.appendChild(aiAudioElement);

    const analyser = sharedAudioContext.createAnalyser();
    analyser.fftSize = 256;
    sharedAiSource.connect(analyser);

    const dataChannels = {};
    const knownPeers = new Set();

    const createMonitoringUI = () => {
      const volumeMonitor = document.createElement('div');
      volumeMonitor.id = 'ai-voice-monitor';
      volumeMonitor.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 10px;
        background-color: rgba(0,0,0,0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
        display: none;
      `;
      volumeMonitor.innerHTML = `
        <div>AI Voice Activity</div>
        <div id="volume-meter" style="width: 200px; height: 20px; background-color: #333; border-radius: 10px; overflow: hidden;">
          <div id="volume-level" style="width: 0%; height: 100%; background-color: green;"></div>
        </div>
        <div id="voice-status">Status: Monitoring...</div>
      `;
      document.body.appendChild(volumeMonitor);

      const peerStatusDiv = document.createElement('div');
      peerStatusDiv.id = 'peer-broadcast-status';
      peerStatusDiv.style.cssText = `
        position: fixed;
        bottom: 170px;
        right: 10px;
        background-color: rgba(0,0,0,0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
        display: none;
      `;
      peerStatusDiv.innerHTML = '<div>Remote Peer Status</div><div id="peer-list"></div>';
      document.body.appendChild(peerStatusDiv);

      const autoBroadcastStatus = document.createElement('div');
      autoBroadcastStatus.id = 'auto-broadcast-status';
      autoBroadcastStatus.style.cssText = `
        position: fixed;
        bottom: 240px;
        right: 10px;
        background-color: rgba(0,128,0,0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
        display: none;
      `;
      autoBroadcastStatus.innerHTML = '<div>Auto-Broadcast: ACTIVE</div><div id="new-peer-count">New peers detected: 0</div>';
      document.body.appendChild(autoBroadcastStatus);
    };

    createMonitoringUI();

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let volumeMonitorInterval;

    const updateVolumeMeter = () => {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const volumePercent = Math.min(100, Math.max(0, average * 2));

      const volumeLevel = document.getElementById('volume-level');
      if (volumeLevel) {
        volumeLevel.style.width = `${volumePercent}%`;
        volumeLevel.style.backgroundColor = volumePercent > 20 ? 'green' : '#333';
      }

      const voiceStatus = document.getElementById('voice-status');
      if (voiceStatus) {
        voiceStatus.textContent = `Status: ${volumePercent > 20 ? 'Voice Detected' : 'Silent'}`;

        if (volumePercent > 20) {
          Object.values(dataChannels).forEach(channel => {
            if (channel && channel.readyState === 'open') {
              try {
                channel.send(JSON.stringify({
                  type: 'voice-detection',
                  volume: volumePercent,
                  agentName: agentName
                }));
              } catch (err) {
                console.warn("Error sending voice detection:", err);
              }
            }
          });
        }
      }
    };

    volumeMonitorInterval = setInterval(updateVolumeMeter, 200);

    const updatePeerStatus = (peerId, status) => {
      const peerList = document.getElementById('peer-list');
      if (!peerList) return;

      let peerElement = document.getElementById(`peer-${peerId}`);
      if (!peerElement) {
        peerElement = document.createElement('div');
        peerElement.id = `peer-${peerId}`;
        peerList.appendChild(peerElement);
      }

      let statusColor = 'orange';
      if (status === 'broadcasting') statusColor = 'green';
      else if (status.startsWith('error')) statusColor = 'red';

      peerElement.innerHTML = `
        <div style="margin: 5px 0; padding: 5px; border-radius: 3px; background-color: rgba(0,0,0,0.3);">
          <span>Peer ${peerId.substring(0, 8)}...</span>
          <span style="color: ${statusColor}; margin-left: 10px;">${status}</span>
        </div>
      `;
    };

    const updateAutoBroadcastStatus = (newPeerCount) => {
      const newPeerCountElement = document.getElementById('new-peer-count');
      if (newPeerCountElement) {
        newPeerCountElement.textContent = `New peers detected: ${newPeerCount}`;
      }
    };

    const createTestButton = () => {
      const testButton = document.createElement('button');
      testButton.innerText = 'Test Audio Broadcast';
      testButton.style.cssText = `
        position: fixed;
        bottom: 320px;
        right: 10px;
        z-index: 1000;
        padding: 10px 20px;
        background-color: #ff7700;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        display: none;
      `;
      testButton.onclick = () => {
        broadcastToAllPeers();
      };
      document.body.appendChild(testButton);
      return testButton;
    };

    const testButton = createTestButton();

    const broadcastToPeer = async (peer) => {
      if (!peer?.pc || peer.pc.connectionState === "closed" || peer.pc.connectionState === "failed") {
        console.warn(`Skipping invalid or closed peer: ${peer?.userId}`);
        updatePeerStatus(peer.userId, 'disconnected');
        return;
      }

      try {
        updatePeerStatus(peer.userId, 'preparing');

        if (!dataChannels[peer.userId]) {
          try {
            const channelId = Math.floor(Math.random() * 65535);
            dataChannels[peer.userId] = peer.pc.createDataChannel(`voice-verification-${channelId}`, {
              ordered: true
            });

            dataChannels[peer.userId].onopen = () => {
              console.log(`Data channel opened for peer ${peer.userId}`);
              updatePeerStatus(peer.userId, 'data-channel-open');
              dataChannels[peer.userId].send(JSON.stringify({
                type: 'connection-test',
                agentName: agentName,
                timestamp: Date.now()
              }));
            };

            dataChannels[peer.userId].onclose = () => {
              console.log(`Data channel closed for peer ${peer.userId}`);
              updatePeerStatus(peer.userId, 'data-channel-closed');
            };

            dataChannels[peer.userId].onerror = (err) => {
              console.error(`Data channel error for peer ${peer.userId}:`, err);
            };
          } catch (err) {
            console.warn(`Could not create data channel for peer ${peer.userId}:`, err);
          }
        }

        const existingSender = peer.pc
          .getSenders()
          .find((s) => s.track?.kind === "audio");

        if (existingSender && existingSender.track) {
          // ✅ Store original track BEFORE replacing it
          if (!originalTracks.has(peer.userId)) {
            originalTracks.set(peer.userId, existingSender.track);
            console.log(`Stored original track for peer ${peer.userId}`);
          }

          updatePeerStatus(peer.userId, 'creating-mixed-track');

          const mixedDestination = sharedAudioContext.createMediaStreamDestination();

          const aiGain = sharedAudioContext.createGain();
          aiGain.gain.value = 1.2;
          sharedAiSource.connect(aiGain);
          aiGain.connect(mixedDestination);

          try {
            const originalTrack = originalTracks.get(peer.userId);
            if (originalTrack && originalTrack.readyState === 'live') {
              const userSource = sharedAudioContext.createMediaStreamSource(
                new MediaStream([originalTrack.clone()])
              );
              const userGain = sharedAudioContext.createGain();
              userGain.gain.value = 0.6;
              userSource.connect(userGain);
              userGain.connect(mixedDestination);
              console.log(`Connected user audio to mixed destination for peer ${peer.userId}`);
            }
          } catch (err) {
            console.warn(`Error connecting original user audio for peer ${peer.userId}:`, err);
          }

          const mixedTrack = mixedDestination.stream.getAudioTracks()[0];

          if (mixedTrack) {
            mixedTrack.enabled = true;

            console.log(`Replacing track for peer ${peer.userId}`);
            await existingSender.replaceTrack(mixedTrack);
            updatePeerStatus(peer.userId, 'track-replaced');

            peer.mixedDestination = mixedDestination;
            peer.mixedTrack = mixedTrack;
            peer.aiGain = aiGain;

            console.log(`Successfully replaced track for peer ${peer.userId}`);

            if (peer.pc.signalingState === "stable") {
              try {
                updatePeerStatus(peer.userId, 'creating-offer');
                const offer = await peer.pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true
                });

                await peer.pc.setLocalDescription(offer);
                updatePeerStatus(peer.userId, 'offer-created');

                if (typeof peer.sendOffer === "function") {
                  await peer.sendOffer(peer.userId, offer);
                  updatePeerStatus(peer.userId, 'offer-sent');
                } else if (typeof window.sendOfferToPeer === "function") {
                  await window.sendOfferToPeer(peer.userId, offer);
                  updatePeerStatus(peer.userId, 'offer-sent');
                } else {
                  console.warn(`No method to send offer to peer ${peer.userId}`);
                  updatePeerStatus(peer.userId, 'no-send-offer-method');
                }
              } catch (offerErr) {
                console.error(`Failed to create/send offer for peer ${peer.userId}:`, offerErr);
                updatePeerStatus(peer.userId, `offer-error: ${offerErr.message}`);
              }
            } else {
              console.log(`Skipping offer for peer ${peer.userId}, signaling state: ${peer.pc.signalingState}`);
              updatePeerStatus(peer.userId, `signaling-state: ${peer.pc.signalingState}`);
            }

            if (dataChannels[peer.userId] && dataChannels[peer.userId].readyState === 'open') {
              try {
                dataChannels[peer.userId].send(JSON.stringify({
                  type: 'voice-start',
                  agentName: agentName,
                  timestamp: Date.now()
                }));
                updatePeerStatus(peer.userId, 'broadcasting');
              } catch (msgErr) {
                console.warn(`Error sending voice-start message to peer ${peer.userId}:`, msgErr);
              }
            } else {
              updatePeerStatus(peer.userId, 'broadcasting-no-data-channel');
            }
          } else {
            console.error(`Failed to get mixed track for peer ${peer.userId}`);
            updatePeerStatus(peer.userId, 'no-mixed-track');
          }
        } else {
          console.warn(`No audio sender found for peer ${peer.userId}`);
          updatePeerStatus(peer.userId, 'no-audio-sender');
        }
      } catch (error) {
        console.error(`Failed to broadcast AI audio to peer ${peer.userId}:`, error);
        updatePeerStatus(peer.userId, `error: ${error.message}`);
      }
    };

    // ✅ NEW: Function to restore original audio tracks
    const restoreOriginalTracks = async () => {
      console.log("🔄 Restoring original audio tracks to all peers...");

      if (!jointPeers?.current) {
        console.warn("No peers to restore");
        return;
      }

      const validPeers = jointPeers.current.filter(peer =>
        peer &&
        peer.userId &&
        peer.pc &&
        peer.pc.connectionState !== "closed" &&
        peer.pc.connectionState !== "failed"
      );

      for (const peer of validPeers) {
        try {
          const existingSender = peer.pc
            .getSenders()
            .find((s) => s.track?.kind === "audio");

          const originalTrack = originalTracks.get(peer.userId);

          if (existingSender && originalTrack && originalTrack.readyState === 'live') {
            console.log(`Restoring original track for peer ${peer.userId}`);
            
            await existingSender.replaceTrack(originalTrack);
            
            // Clean up mixed audio resources
            if (peer.mixedDestination) {
              try {
                peer.mixedDestination.disconnect();
              } catch (e) { }
              delete peer.mixedDestination;
            }
            
            if (peer.aiGain) {
              try {
                peer.aiGain.disconnect();
              } catch (e) { }
              delete peer.aiGain;
            }
            
            if (peer.mixedTrack) {
              try {
                peer.mixedTrack.stop();
              } catch (e) { }
              delete peer.mixedTrack;
            }

            // Create new offer with restored track
            if (peer.pc.signalingState === "stable") {
              try {
                const offer = await peer.pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true
                });

                await peer.pc.setLocalDescription(offer);

                if (typeof peer.sendOffer === "function") {
                  await peer.sendOffer(peer.userId, offer);
                } else if (typeof window.sendOfferToPeer === "function") {
                  await window.sendOfferToPeer(peer.userId, offer);
                }

                console.log(`✅ Successfully restored track for peer ${peer.userId}`);
                updatePeerStatus(peer.userId, 'restored');
              } catch (offerErr) {
                console.error(`Failed to send restore offer for peer ${peer.userId}:`, offerErr);
              }
            }

            // Notify peer via data channel
            if (dataChannels[peer.userId] && dataChannels[peer.userId].readyState === 'open') {
              try {
                dataChannels[peer.userId].send(JSON.stringify({
                  type: 'voice-end',
                  agentName: agentName,
                  timestamp: Date.now()
                }));
              } catch (msgErr) {
                console.warn(`Error sending voice-end message to peer ${peer.userId}:`, msgErr);
              }
            }
          } else {
            console.warn(`Cannot restore track for peer ${peer.userId} - original track not available or not live`);
          }
        } catch (error) {
          console.error(`Error restoring track for peer ${peer.userId}:`, error);
        }
      }

      console.log("🔄 Finished restoring original tracks");
    };

    const broadcastToAllPeers = async () => {
      if (jointPeers?.current && jointPeers.current.length > 0) {
        console.log(`🔊 Broadcasting AI audio to ${jointPeers.current.length} peers`);

        const validPeers = jointPeers.current.filter(peer =>
          peer &&
          peer.userId &&
          peer.pc &&
          peer.pc.connectionState !== "closed" &&
          peer.pc.connectionState !== "failed"
        );

        console.log(`Found ${validPeers.length} valid peers for broadcasting`);

        const broadcastPromises = validPeers.map(async (peer) => {
          try {
            console.log(`Broadcasting to peer ${peer.userId} (state: ${peer.pc.connectionState})`);
            await broadcastToPeer(peer);
            console.log(`✅ Successfully broadcasted to peer ${peer.userId}`);
          } catch (err) {
            console.error(`❌ Failed to broadcast to peer ${peer.userId}:`, err);
            updatePeerStatus(peer.userId, `broadcast-error: ${err.message}`);
          }
        });

        await Promise.allSettled(broadcastPromises);
        console.log(`Completed broadcasting to all peers`);
      } else {
        console.warn("No joint peers found to broadcast AI audio to");
      }
    };

    const broadcastToNewPeer = async (newPeer) => {
      console.log(`Auto-broadcasting to new peer: ${newPeer.userId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (newPeer.pc && newPeer.pc.connectionState === 'connected') {
        await broadcastToPeer(newPeer);
      } else {
        console.log(`Waiting for peer ${newPeer.userId} connection to stabilize...`);
        let attempts = 0;
        const maxAttempts = 20;

        const waitForConnection = async () => {
          if (attempts >= maxAttempts) {
            console.warn(`Timeout waiting for peer ${newPeer.userId} connection`);
            return;
          }

          if (newPeer.pc && (newPeer.pc.connectionState === 'connected' || newPeer.pc.connectionState === 'connecting')) {
            await broadcastToPeer(newPeer);
          } else {
            attempts++;
            setTimeout(waitForConnection, 500);
          }
        };

        waitForConnection();
      }
    };

    let newPeerCount = 0;

    const monitorNewPeers = () => {
      if (jointPeers?.current) {
        const currentPeerIds = new Set(
          jointPeers.current
            .filter(peer => peer && peer.userId)
            .map(peer => peer.userId)
        );

        const newPeers = jointPeers.current.filter(peer =>
          peer && peer.userId && !knownPeers.has(peer.userId)
        );

        if (newPeers.length > 0) {
          console.log(`🎯 NEW PEERS DETECTED: ${newPeers.length} new peer(s)`);
          newPeerCount += newPeers.length;
          updateAutoBroadcastStatus(newPeerCount);

          newPeers.forEach(peer => {
            knownPeers.add(peer.userId);
            console.log(`Added new peer to monitoring: ${peer.userId}`);
            broadcastToNewPeer(peer).catch(err => {
              console.error(`Error auto-broadcasting to new peer ${peer.userId}:`, err);
            });
          });
        }

        const leftPeers = Array.from(knownPeers).filter(knownPeerId =>
          !currentPeerIds.has(knownPeerId)
        );

        leftPeers.forEach(leftPeerId => {
          console.log(`Peer left: ${leftPeerId}`);
          knownPeers.delete(leftPeerId);
          originalTracks.delete(leftPeerId); // Clean up stored track
          const peerElement = document.getElementById(`peer-${leftPeerId}`);
          if (peerElement) {
            peerElement.remove();
          }
        });
      }

      setTimeout(monitorNewPeers, 2000);
    };

    if (jointPeers?.current) {
      jointPeers.current.forEach(peer => {
        if (peer && peer.userId) {
          knownPeers.add(peer.userId);
        }
      });
      console.log(`Initialized with ${knownPeers.size} existing peers`);
    }

    monitorNewPeers();

    let isAiActive = false;
    let silenceCounter = 0;
    let activationCheckInterval;

    const detectAiAgentActivation = () => {
      const checkAiActivation = () => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const volumePercent = Math.min(100, Math.max(0, average * 2));

        if (volumePercent > 20 && !isAiActive) {
          console.log("🎤 AI AGENT ACTIVATED");
          isAiActive = true;
          broadcastToAllPeers().catch(err => {
            console.error("Error broadcasting on AI activation:", err);
          });

          const autoBroadcastStatus = document.getElementById('auto-broadcast-status');
          if (autoBroadcastStatus) {
            autoBroadcastStatus.style.backgroundColor = 'rgba(0,255,0,0.8)';
            autoBroadcastStatus.innerHTML = '<div>Auto-Broadcast: AI ACTIVE</div><div>Broadcasting to all peers...</div>';
          }
        }

        if (volumePercent < 5 && isAiActive) {
          silenceCounter++;
          if (silenceCounter > 30) {
            isAiActive = false;
            silenceCounter = 0;
            console.log("AI agent deactivated");

            const autoBroadcastStatus = document.getElementById('auto-broadcast-status');
            if (autoBroadcastStatus) {
              autoBroadcastStatus.style.backgroundColor = 'rgba(0,128,0,0.7)';
              autoBroadcastStatus.innerHTML = '<div>Auto-Broadcast: STANDBY</div><div>Waiting for AI activation...</div>';
            }
          }
        } else if (volumePercent > 5) {
          silenceCounter = 0;
        }
      };

      activationCheckInterval = setInterval(checkAiActivation, 200);

      return () => {
        if (activationCheckInterval) {
          clearInterval(activationCheckInterval);
        }
      };
    };

    const stopAiActivationDetection = detectAiAgentActivation();

    await broadcastToAllPeers();

    // ✅ ENHANCED: Return cleanup function that restores original tracks
    return async () => {
      console.log("Cleaning up audio broadcast and restoring original tracks...");

      // First, restore original tracks to all peers
      await restoreOriginalTracks();

      // Stop intervals
      if (volumeMonitorInterval) {
        clearInterval(volumeMonitorInterval);
      }
      if (stopAiActivationDetection) {
        stopAiActivationDetection();
      }

      // Disconnect all audio nodes
      try {
        sharedAiSource.disconnect();
        analyser.disconnect();
      } catch (e) {
        console.warn("Error disconnecting audio nodes:", e);
      }

      // Close shared audio context
      if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
        sharedAudioContext.close().catch(e => console.warn("Error closing audio context:", e));
      }

      // Clean up peer-specific resources
      if (jointPeers?.current) {
        jointPeers.current.forEach(peer => {
          if (peer.mixedDestination) {
            try {
              peer.mixedDestination.disconnect();
            } catch (e) { }
          }
          if (peer.aiGain) {
            try {
              peer.aiGain.disconnect();
            } catch (e) { }
          }
        });
      }

      // Clear stored original tracks
      originalTracks.clear();

      // Remove UI elements
      ['ai-voice-monitor', 'peer-broadcast-status', 'auto-broadcast-status'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.remove();
      });

      if (aiAudioElement && aiAudioElement.parentNode) {
        aiAudioElement.remove();
      }
      if (testButton && testButton.parentNode) {
        testButton.remove();
      }

      console.log("Cleanup complete - original tracks restored");
    };

  } catch (error) {
    console.error("Failed to broadcast AI audio:", error);

    ['ai-voice-monitor', 'peer-broadcast-status', 'auto-broadcast-status'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.remove();
    });

    return () => { };
  }
};