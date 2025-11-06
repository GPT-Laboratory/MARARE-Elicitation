
import React, { useState, useEffect, useRef, } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Typography, Drawer, Spin, List } from 'antd';
import {
  EyeOutlined,
  RocketOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  FileTextOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';



import { GiArtificialHive } from 'react-icons/gi';
import { getSocket } from './socketInstance';
import { setEnableCaptions, setFunctionalRequirements, setMeetingNotes, setMVP, setNonFunctionalRequirements, setVision } from './features/mainStates/MainStates_Slice';
import { useRefs } from './RefProvider';
import { startAutoSend, stopAutoSend, setTeamAmvp, setTeamAvision, setTeamBmvp, setTeamBvision, setTeamCmvp, setTeamCvision } from '../../app2/features/ReportSlice';
import { Sparkles } from 'lucide-react';
import { initializeAzureSTT, processRemoteStream, stopAllSTTRecognizers } from './Helper/Helper';
import store from '../Redux/store';

// Add these imports at the top
import { SettingOutlined } from '@ant-design/icons';
// import { updateTeamAgent } from './path-to-your-teamConfigSlice'; // Update path
import ConfigurationDrawer from './TeamsConfiguration';
import TeamSectionData from './TeamSection';
import { teamColors } from './TeamsColors';
import { useParams } from 'react-router-dom';



const { Title, Paragraph, Text } = Typography;
// const { Title, Text } = Typography;

const RealtimeMvpVisionDisplay = (meetingId) => {
  const { mvp, vision, meeting_notes, functional_requirements, non_functional_requirements } = useSelector(
    (state) => state.MainStates_Slice
  );
  // const teamData = useSelector((state) => state.ReportSlice);
  const teamA = useSelector((state) => state.reports.teamA);
  const teamB = useSelector((state) => state.reports.teamB);
  const teamC = useSelector((state) => state.reports.teamC);



  // const teamA = useSelector((state) => state.teamConfig.teamA);
  // const teamB = useSelector((state) => state.teamConfig.teamB);
  // Add Team C selector
  // const teamC = useSelector((state) => state.teamConfig.teamC);


  const agent = useSelector((state) => state.MainStates_Slice.agent);
  const enableCaptions = useSelector(
    (state) => state.MainStates_Slice.enableCaptions
  );
  const agentName = useSelector((state) => state.MainStates_Slice.agentName);
  const activeAgent = useSelector(
    (state) => state.MainStates_Slice.activateAgent
  );
  const ephemeralKey = useSelector((state) => state.MainStates_Slice.ephemeralKey);

  // Add this state inside your component
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const teamConfig = useSelector((state) => state.teamConfig);











  // COMPLETELY REWRITTEN - Single useEffect approach for proper cleanup

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoopActive, setIsLoopActive] = useState(false);
  const [isStop, setIsStop] = useState(false); // Renamed from isStop to shouldStop for clarity
  const [shouldStop, setShouldStop] = useState(false); // Changed from isStop
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [shouldStart, setShouldStart] = useState(false); // New trigger for starting
  const socket = getSocket();
  const dispatch = useDispatch();
   const { project_id, id } = useParams();

  // Add these new states after your existing states
  // const [lastSentPositions, setLastSentPositions] = useState({
  //   local: 0,
  //   remote: {}
  // });

  const {
    localStream,
    jointPeers,
    localTranscript,
    remoteTranscript,
    remoteVideoRefs,
    setLocalTranscript,
    setLocaltranscriptView,
    setRemoteTranscript,
    setRemotetranscriptView,
    remotePeers,
    getNewTranscripts,           // New
    updateLastSentPositions,     // New
    resetLastSentPositions,
  } = useRefs();

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const isContentEmpty = !mvp && !vision && !meeting_notes && !functional_requirements && !non_functional_requirements && !teamA.mvp && !teamA.vision && !teamB.mvp && !teamB.vision;



  // Update sendTranscripts function





  const sendTranscripts = () => {
    const { newLocalTranscript, newRemoteTranscript, newAgentTranscript } = getNewTranscripts();

    // Check if there's any new content
    const hasNewLocal = newLocalTranscript.length > 0;
    console.log("New remote length:", newLocalTranscript);
    const hasNewRemote = Object.keys(newRemoteTranscript).some(
      userId => newRemoteTranscript[userId].length > 0
    );
    const hasNewAgent = newAgentTranscript.length > 0;

    if (!hasNewLocal && !hasNewRemote && !hasNewAgent) {
      console.log("No new transcripts to send");
      return;
    }

    console.log("=== SENDING NEW TRANSCRIPTS ===");
    console.log("New LocalTranscript:", newLocalTranscript);
    console.log("New RemoteTranscript:", newRemoteTranscript);
    console.log("New AgentTranscript:", newAgentTranscript);

    // Convert arrays to strings for backend
    const transcripts = {
      localUser: newLocalTranscript.join(' '),
      remoteUser: Object.keys(newRemoteTranscript).map(userId =>
        newRemoteTranscript[userId].join(' ')
      ).join(' '),
      // agentUser: newAgentTranscript.join(" "),
      agentUser: newAgentTranscript.filter(Boolean).join(" ")

    };

    setWaitingForResponse(true);
    socket.emit("transcripts", {
      meetingId: meetingId?.meetingId || meetingId,
      transcripts,
      teamConfig
    });

    // Update positions after sending
    updateLastSentPositions();

    console.log("New transcripts sent successfully");
  };

  useEffect(() => {
    let intervalId = null;
    let timeoutId = null;

    console.log("🔧 Main effect triggered. shouldStart:", shouldStart, "shouldStop:", shouldStop);

    if (shouldStart && !shouldStop) {
      console.log("🚀 Starting auto-send loop...");

      // Send first transcript immediately
      sendTranscripts();

      // Start interval for recurring sends
      intervalId = setInterval(() => {
        console.log("⏰ Interval triggered - checking stop status");
        console.log("shouldStop:", shouldStop);

        if (!shouldStop) {
          console.log("📤 Auto-sending transcripts...");
          sendTranscripts();
        } else {
          console.log("🛑 Stop detected - interval will be cleared");
        }
      }, 30000); // 15 seconds

      console.log("✅ Interval started with ID:", intervalId);
      setIsLoopActive(true);

      // Store in Redux
      dispatch(startAutoSend(intervalId));
    }

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up intervals and timeouts...");

      if (intervalId) {
        clearInterval(intervalId);
        console.log("✅ Interval cleared:", intervalId);
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log("✅ Timeout cleared:", timeoutId);
      }

      dispatch(stopAutoSend());
    };
  }, [shouldStart, shouldStop]); // Only depend on these two flags

  // ✅ Simple start function
  const handleGenerate = async () => {
   
    socket.emit("captions-toggled", {
      meetingId: id,
      userId: socket.id,
      enableCaptions: true,
    });
    console.log("🎯 Generate clicked");


    setIsGenerating(true);
    setWaitingForResponse(true);
    setShouldStop(false); // Reset stop flag
    setShouldStart(true); // Trigger start


    dispatch(setEnableCaptions(true));

    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      console.log("Initializing Azure STT for agent:", agentName);
      await initializeAzureSTT(
        audioTrack,
        shouldStop,
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
      );
    }

    await processRemoteStream(
      remotePeers,
      remoteVideoRefs,
      setRemoteTranscript,
      setRemotetranscriptView,
      remoteTranscript
    );
  };

  // ✅ Simple start again function
  const handleStartAgain = async () => {
    console.log("🔄 Start Again clicked");
    dispatch(setEnableCaptions(true));
    socket.emit("captions-toggled", {
      meetingId: id,
      userId: socket.id,
      enableCaptions: true,
    });
    console.log("🎯 Generate clicked");

    sendTranscripts(); // Send immediately on start again
    

    setIsGenerating(true);
    setShouldStop(false); // Reset stop flag
    setShouldStart(true); // Trigger start




    

    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      console.log("Initializing Azure STT for agent:", agentName);
      await initializeAzureSTT(
        audioTrack,
        shouldStop,
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
      );
    }

    await processRemoteStream(
      remotePeers,
      remoteVideoRefs,
      setRemoteTranscript,
      setRemotetranscriptView,
      remoteTranscript
    );
  };

  // ✅ SIMPLE stop function
  const handleStopLoop = () => {
    console.log("🛑 STOP BUTTON CLICKED");
    dispatch(setEnableCaptions(false));
    socket.emit("captions-toggled", {
      meetingId: id,
      userId: socket.id,
      enableCaptions: false,
    });
    console.log("🎯 Generate clicked");
    

    // Just set the flags - useEffect will handle cleanup
    setShouldStop(true);
    setShouldStart(false);
    setIsStop(true);
    setIsLoopActive(false);
    setIsGenerating(false);
    setWaitingForResponse(false);


    // Reset positions when stopping
    resetLastSentPositions();

  
    stopAllSTTRecognizers();



    console.log("✅ Stop flags set - useEffect will clean up");
  };

  // ✅ Socket listener - SIMPLIFIED
  useEffect(() => {
    console.log("🔧 Setting up socket listener...");

    const handleAgentUpdates = (data) => {
      console.log("📨 Received agent updates:", data);
      console.log("shouldStop at response:", shouldStop);

      setIsGenerating(false);
      setWaitingForResponse(false);

      // Update Redux for team data
      if (data.team_a_mvp) dispatch(setTeamAmvp(data.team_a_mvp));
      if (data.team_a_vision) dispatch(setTeamAvision(data.team_a_vision));
      if (data.team_b_mvp) dispatch(setTeamBmvp(data.team_b_mvp));
      if (data.team_b_vision) dispatch(setTeamBvision(data.team_b_vision));
      if (data.team_c_mvp) dispatch(setTeamCmvp(data.team_c_mvp));
      if (data.team_c_vision) dispatch(setTeamCvision(data.team_c_vision));



      if (data.meeting_notes && data.meeting_notes !== meeting_notes)
        dispatch(setMeetingNotes(data.meeting_notes));
      if (data.functional_requirements && data.functional_requirements !== functional_requirements)
        dispatch(setFunctionalRequirements(data.functional_requirements));
      if (data.non_functional_requirements && data.non_functional_requirements !== non_functional_requirements)
        dispatch(setNonFunctionalRequirements(data.non_functional_requirements));

      socket.emit("mvpvision-updates", {
        meetingId: meetingId.meetingId,
        team_a_mvp: data.team_a_mvp,
        team_a_vision: data.team_a_vision,
        team_b_mvp: data.team_b_mvp,
        team_b_vision: data.team_b_vision,
        team_c_mvp: data.team_c_mvp,
        team_c_vision: data.team_c_vision,
      });

      // NO RESTART LOGIC HERE - the interval continues running automatically
      console.log("✅ Response processed - interval continues running");
      // setIsStop(false);
      setIsLoopActive(true);
    };

    socket.on("agent_updates", handleAgentUpdates);

    return () => {
      console.log("🧹 Cleaning up socket listener...");
      socket.off("agent_updates", handleAgentUpdates);
    };
  }, [socket, dispatch, shouldStop]); // Include shouldStop in dependencies


  const GenerateButton = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm">
        <ThunderboltOutlined style={{ fontSize: '56px', color: '#2B7FFF' }} />
      </div>
      <Title level={2} className="mb-4 text-gray-800 font-semibold">
        Generate Meeting Summary
      </Title>
      <Paragraph className="mb-8 text-gray-600 max-w-lg text-lg leading-relaxed">
        Transform your meeting transcripts into actionable insights with AI-powered analysis
      </Paragraph>

      {/* Configuration and Generate buttons */}

      <div className="flex gap-4 items-center">
        {agent && (
          <Button
            type="default"
            size="large"
            onClick={() => setConfigDrawerOpen(true)}
            className="shadow-lg border-0 px-8 py-3 h-auto font-semibold"
            style={{
              borderRadius: '12px',
              fontSize: '16px',
              border: '2px solid #e5e7eb',
              color: '#374151'
            }}
            icon={<SettingOutlined />}
          >
            Configuration
          </Button>
        )}

        {agent && (
          <Button
            type="primary"
            size="large"
            loading={isGenerating}
            onClick={handleGenerate}
            className="shadow-lg border-0 px-10 py-3 h-auto font-semibold"
            style={{
              backgroundColor: '#2B7FFF',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #2B7FFF 0%, #1e40af 100%)'
            }}
            icon={!isGenerating && <ThunderboltOutlined />}
          >
            {isGenerating ? 'Generating Summary...' : 'Generate Now'}
          </Button>
        )}
      </div>
    </div>
  );


  const TeamSection = ({ teamName, teamColor, visionContent, mvpContent }) => {
    const mvpPoints = mvpContent
    ? mvpContent.split("•").map((item) => item.trim()).filter(Boolean)
    : [];
    
    return (
    <div className="md:w-[32%] mb-8">
      {/* Team Header */}
      <div className="flex items-center mb-4">
        <div
          className="p-3 rounded-xl mr-4 shadow-sm"
          style={{ backgroundColor: teamColor.iconBg, color: teamColor.text }}
        >
          <GiArtificialHive style={{ fontSize: "24px" }} />
        </div>
        <Title level={3} className="mb-0 text-gray-800 font-semibold">
          {teamName}
        </Title>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* MVP Card */}
        <Card
          className="shadow-md border-0 transition-all duration-300 hover:shadow-xl"
          style={{
            borderRadius: "16px",
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            border: `1px solid ${teamColor.border}`,
            height: "400px",
            overflow:'hidden',
          }}
          bodyStyle={{ padding: "0", height: "100%" }}
        >
          <div
            className="p-4"
            style={{
             
              background: `linear-gradient(135deg, ${teamColor.bg} 0%, ${teamColor.bgSecondary} 100%)`,
              borderBottom: `1px solid ${teamColor.border}`,
            }}
          >
            <div className="flex items-center">
              <RocketOutlined
                style={{ fontSize: "18px", color: teamColor.text, marginRight: "8px" }}
              />
              <Title level={5} className="mb-0 text-gray-800 font-semibold">
                MVP Strategy
              </Title>
            </div>
          </div>
          <div className="p-4 overflow-y-auto" style={{ height: "calc(100% - 60px)" }}>
            {mvpPoints.length > 0 ? (
              <List
                dataSource={mvpPoints}
                renderItem={(item) => (
                  <List.Item style={{ padding: "4px 0" }}>
                    <Text className="text-gray-700 text-sm ">{item}</Text>
                  </List.Item>
                )}
              />
            ) : (
              <Text className="text-gray-400 italic text-sm">
                No MVP available yet
              </Text>
            )}
          </div>
        </Card>

        {/* Vision Card */}
        <Card
          className="shadow-md border-0 transition-all duration-300 hover:shadow-xl"
          style={{
            borderRadius: "16px",
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            border: `1px solid ${teamColor.border}`,
            height: "300px",
          }}
          bodyStyle={{ padding: "0", height: "100%" }}
        >
          <div
            className="p-4"
            style={{
              background: `linear-gradient(135deg, ${teamColor.bg} 0%, ${teamColor.bgSecondary} 100%)`,
              borderBottom: `1px solid ${teamColor.border}`,
            }}
          >
            <div className="flex items-center">
              <EyeOutlined
                style={{ fontSize: "18px", color: teamColor.text, marginRight: "8px" }}
              />
              <Title level={5} className="mb-0 text-gray-800 font-semibold">
                Vision Statement
              </Title>
            </div>
          </div>
          <div className="p-4 overflow-y-auto" style={{ height: "calc(100% - 60px)" }}>
            <div className="text-gray-700 leading-relaxed text-sm">
              {visionContent || (
                <span className="text-gray-400 italic">No vision available yet</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
  };

  const MainContent = () => {
    if (isContentEmpty) return <GenerateButton />;

    return (
      <div className="p-6">

        {/* // Update the section with the stop loop button */}
        {(isLoopActive || isStop) && (
          <div className="mb-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isLoopActive ? (
                  <>
                    <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-green-800 font-medium">Auto-updating every 10 seconds</span>
                    <span className="text-green-600 text-sm ml-2">(Real-time sync active)</span>

                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                    <span className="text-gray-600 font-medium">Auto-update stopped</span>

                  </>
                )}
              </div>
              <div className="flex gap-2">
                {/* Configuration Button */}
                <Button
                  type="default"
                  size="small"
                  onClick={() => setConfigDrawerOpen(true)}
                  className="shadow-sm border font-medium"
                  style={{
                    borderRadius: '8px',
                  }}
                  icon={<SettingOutlined />}
                >
                  Config
                </Button>

                {isLoopActive ? (
                  <Button
                    type="text"
                    size="small"
                    onClick={handleStopLoop}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                    icon={<CloseOutlined />}
                    disabled={waitingForResponse}
                  >
                    {waitingForResponse ? 'please wait your response is generating' : 'Stop Auto-Update'}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    loading={isGenerating}
                    onClick={handleStartAgain}
                    className="shadow-sm border-0 font-medium"
                    style={{
                      backgroundColor: '#16a34a',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                    }}
                    icon={!isGenerating && <ThunderboltOutlined />}
                  >
                    {isGenerating ? 'Starting...' : 'Start Again'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}



        <div className='md:flex md:justify-between  '>

         
           <TeamSection
            teamName="Team A (OpenAI Models)"
            teamColor={{
              bg: '#f0f9ff',
              bgSecondary: '#e0f2fe',
              iconBg: '#ffffff',
              text: '#0284c7',
              border: '#7dd3fc'
            }}
            visionContent={teamC.vision}
            mvpContent={teamC.mvp}
          />

          <TeamSection
            teamName="Team B (Mistrail Models)"
            teamColor={{
              bg: '#f0fdf4',
              bgSecondary: '#dcfce7',
              iconBg: '#ffffff',
              text: '#16a34a',
              border: '#86efac'
            }}
            visionContent={teamB.vision}
            mvpContent={teamB.mvp}
          />

           <TeamSection
            teamName="Team C (Ollama Models)"
            teamColor={{
              bg: '#fef3f2',
              bgSecondary: '#fee2e2',
              iconBg: '#ffffff',
              text: '#dc2626',
              border: '#fca5a5'
            }}
            visionContent={teamA.vision}
            mvpContent={teamA.mvp}
          />

         

        </div>
      </div>
    );
  };

  return (
    <>
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<Sparkles />}
        onClick={toggleMobileDrawer}
        className="shadow-xl border-0 flex items-center justify-center transition-all duration-300 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #2B7FFF 0%, #1e40af 100%)',
          width: '42px',
          height: '42px'
        }}
      />

      <Drawer
        title={
          <div className="flex items-center ">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mr-4 shadow-sm">
              <RocketOutlined style={{ color: '#2B7FFF', fontSize: '22px' }} />
            </div>
            <div>
              <span style={{ color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                Company Overview
              </span>
              <div className="text-sm text-gray-500 font-normal">
                AI-Generated Meeting Summary
              </div>
            </div>
          </div>
        }
        placement="right"
        onClose={toggleMobileDrawer}
        open={mobileDrawerOpen}
        width={1600}
        headerStyle={{
          borderBottom: '2px solid #e5e7eb',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}
        bodyStyle={{
          padding: '0',
          backgroundColor: '#fafbfc',
          background: 'linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%)'
        }}
        closeIcon={<CloseOutlined style={{ fontSize: '18px', color: '#6b7280' }} />}
        className="professional-drawer"
      >
        <MainContent />
      </Drawer>


      {/* // Add the configuration drawer to your return statement (after the main drawer) */}
      <ConfigurationDrawer
        open={configDrawerOpen}
        onClose={() => setConfigDrawerOpen(false)}
      />

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .professional-drawer .ant-drawer-content {
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.08);
          width: 75vw !important;
        }
        
        .group:hover {
          transform: translateY(-2px);
        }
        
        @media (max-width: 800px) {
          .professional-drawer .ant-drawer-content {
            width: 100vw !important;
          }
        }
      `}</style>
    </>
  );
};

export default RealtimeMvpVisionDisplay;