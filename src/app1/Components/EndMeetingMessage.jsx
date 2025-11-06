




import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
  Tag,
  Timeline,
  Input,
  message,
  notification,
} from 'antd';
import {
  CheckCircleFilled,
  FileTextOutlined,
  DashboardOutlined,
  BulbOutlined,
  RocketOutlined,
  TeamOutlined,
  EyeOutlined,
  TrophyOutlined,
  CheckOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useRefs } from './RefProvider';
import { setTeamAmvp, setTeamAvision, setTeamBmvp, setTeamBvision, setTeamCmvp, setTeamCvision } from '../../app2/features/ReportSlice';
import Metrices from './Metrices';
import ArtifactScorer from './ArtifactScorer';
import { text } from '@fortawesome/fontawesome-svg-core';

import DownloadPDFButtons from '../../app2/components/DownloadPDFButtons';
import { socketURL } from './socketInstance';
import { getUserId } from '../../app2/components/GetLoginUserId';
import FullPageLoader from '../../app2/FullPageLoader';
import { fetchUserStories } from '../../app2/features/MainSlice';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const EndMeetingMessage = () => {
  const userId = getUserId();
  const [activeTab, setActiveTab] = useState('teams');
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempValues, setTempValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const agenda = useSelector((state) => state.MainStates_Slice.agenda);


  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  // Redux states
  const { mvp, vision } = useSelector((state) => state.MainStates_Slice);
  const teamA = useSelector((state) => state.reports.teamA);
  const teamB = useSelector((state) => state.reports.teamB);
  const teamC = useSelector((state) => state.reports.teamC);
  // const localTranscript = useSelector((state) => state.reports.localTranscript);
  // const remoteTranscripts = useSelector((state) => state.reports.remoteTranscripts);
  const {
    localtranscriptView,
    remotetranscriptView,
    formattedTime,
    agentTranscript,
    // setAgentTranscriptView,
    agentTranscriptView,
  } = useRefs();
  // Check if any team is approved (has both MVP and Vision set in main state)
  const isAnyTeamApproved = mvp && vision;

  // console.log("remoteTranscript:", remoteTranscript);

  const teams = [
    {
      id: 'C',
      name: 'Team GPT',
      data: teamC,
      color: '#1890ff',
      bgColor: '#f0f8ff'
    },
    {
      id: 'B',
      name: 'Team Mistrial',
      data: teamB,
      color: '#52c41a',
      bgColor: '#f6ffed'
    },
    {
      id: 'A',
      name: 'Team Llama',
      data: teamA,
      color: '#fa8c16',
      bgColor: '#fff7e6'
    }

  ];



  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }


  // Process remote transcript to extract user names and their messages
  // const processRemoteTranscript = (remoteTranscript) => {
  //   if (!remoteTranscript || typeof remoteTranscript !== 'object') {
  //     return [];
  //   }

  //   const remoteTranscripts = [];

  //   // Iterate through each user in remoteTranscript
  //   Object.keys(remoteTranscript).forEach(userName => {
  //     const userMessages = remoteTranscript[userName];

  //     if (Array.isArray(userMessages)) {
  //       // Chunk the user's messages and create transcript objects
  //       chunkArray(userMessages, 1).forEach(chunk => {
  //         remoteTranscripts.push({
  //           text: chunk.join(" "),
  //           source: 'Remote',
  //           speaker: userName // Add the actual user name
  //         });
  //       });
  //     }
  //   });

  //   return remoteTranscripts;
  // };

  // Updated processRemoteTranscript function
  const processRemoteTranscript = (remoteTranscript) => {
    if (!remoteTranscript || typeof remoteTranscript !== 'object') {
      return [];
    }

    const remoteTranscripts = [];

    Object.keys(remoteTranscript).forEach(userName => {
      const userMessages = remoteTranscript[userName];

      if (Array.isArray(userMessages)) {
        userMessages.forEach(message => {
          remoteTranscripts.push({
            text: message.text,
            timestamp: message.timestamp,
            source: 'Remote',
            speaker: userName
          });
        });
      }
    });

    return remoteTranscripts;
  };

  // Updated allTranscripts array
  // const allTranscripts = [
  //   ...(Array.isArray(localTranscript)
  //     ? chunkArray(localTranscript, 1).map(chunk => ({
  //       text: chunk.join(" "),
  //       source: 'You'
  //     }))
  //     : []),

  //   // Use the new function to process remote transcript
  //   ...processRemoteTranscript(remoteTranscript),

  //   ...(Array.isArray(agentTranscript)
  //     ? chunkArray(agentTranscript, 50).map(chunk => ({
  //       text: chunk.join(" "),
  //       source: 'Agent'
  //     }))
  //     : [])
  // ];

  console.log("remote transcript", remotetranscriptView, localtranscriptView);
  

  // Updated allTranscripts array with sorting
  const allTranscripts = [
    ...(Array.isArray(localtranscriptView)
      ? localtranscriptView.map(item => ({
        text: item.text,
        timestamp: item.timestamp,
        source: 'You'
      }))
      : []),

    ...processRemoteTranscript(remotetranscriptView),

    ...(Array.isArray(agentTranscriptView)
      ? agentTranscriptView.map((item, index) => ({
        text: typeof item === 'string' ? item : item.text,
        timestamp: typeof item === 'object' ? item.timestamp : Date.now() + index,
        source: 'Agent'
      }))
      : [])
  ].sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp chronologically

  console.log("allTranscripts:", allTranscripts);


  const handleEdit = (teamId, field) => {
    const team = teams.find(t => t.id === teamId);
    setEditingTeam(teamId);
    setEditingField(field);
    setTempValues({ [field]: team.data[field] || '' });
  };

  const handleSave = (teamId, field) => {

    console.log('Saving', teamId, field, tempValues[field]);

    const value = tempValues[field];

    // Update team data in Redux
    const updateAction = {
      type: `reports/updateTeam${teamId}`,
      payload: { [field]: tempValues[field] }
    };
    dispatch(updateAction);

    // Check teamId and field to dispatch specific actions
    if (teamId === "C" && field === "vision") {
      dispatch(setTeamCvision(value));
    } else if (teamId === "C" && field === "mvp") {
      dispatch(setTeamCmvp(value));
    } else if (teamId === "A" && field === "vision") {
      dispatch(setTeamAvision(value));
    } else if (teamId === "A" && field === "mvp") {
      dispatch(setTeamAmvp(value));
    } else if (teamId === "B" && field === "vision") {
      dispatch(setTeamBvision(value));
    } else if (teamId === "B" && field === "mvp") {
      dispatch(setTeamBmvp(value));
    }

    setEditingTeam(null);
    setEditingField(null);
    setTempValues({});
    message.success(`Team ${teamId} ${field} updated successfully`);
  };

  const handleApprove = (team) => {
    if (!team.data.vision || !team.data.mvp) {
      message.error('Please ensure both Vision and MVP are filled before approving');
      return;
    }

    // Set the approved team's data to main state
    dispatch({ type: 'MainStates_Slice/setVision', payload: team.data.vision });
    dispatch({ type: 'MainStates_Slice/setMVP', payload: team.data.mvp });

    setSelectedTeam(team.name);  // <-- save which team is selected

    message.success(`${team.name} approved successfully!`);
  };

  // const handleCreateUserStories = async () => {
  //   if (!isAnyTeamApproved) {
  //     message.warning('Please approve a team first');
  //     return;
  //   }
  //   // navigate(`/project/${id}`);

  //   try {
  //     setLoading(true);

  //     // const response = await fetch("/api/generate-user-stories", {
  //     const response = await fetch(`${socketURL}/generate-user-stories`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },

  //       body: JSON.stringify({
  //         // objective: name,
  //         // request_id: requestId,
  //         project_id: id,
  //         agenda: agenda,
  //         vision: vision,
  //         mvp: mvp,
  //         meeting_transcript: allTranscripts,
  //         model: '',
  //         agents: '',
  //         new_version: false,
  //         selectedUserStory: 123,
  //         user_id: userId,
  //         meeting_duration: formattedTime,
  //       }),
  //     });
  //     if (!response.ok) {
  //       throw new Error("Response");
  //     }
      

  //     setLoading(false);
  //     // notification.success({
  //     //   message: "User stories Generated",
  //     // });
  //     navigate(`/project/${id}`);
  //   } catch (error) {
  //     console.error("Error submitting data:", error);
  //     setLoading(false);
  //     notification.error({
  //       message: "Internal Server Error",
  //     });
  //   }

  // };


  const handleCreateUserStories = async () => {
  if (!isAnyTeamApproved) {
    message.warning("Please approve a team first");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(`${socketURL}/generate-user-stories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: id,
        agenda,
        vision,
        mvp,
        meeting_transcript: allTranscripts,
        model: "",
        agents: "",
        new_version: false,
        selectedUserStory: 123,
        user_id: userId,
        meeting_duration: formattedTime,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create user stories");
    }

    // ✅ Successfully created
    setLoading(false);
    notification.success({
      message: "User stories generated successfully",
    });

    // ✅ Now fetch all stories
    const resultAction = await dispatch(fetchUserStories());

    if (fetchUserStories.fulfilled.match(resultAction)) {
      const stories = resultAction.payload;

      if (stories && stories.length > 0) {
        // ✅ Get the latest created story ID
        console.log("fetched stories with latest story");
        
        const latestStory = stories[stories.length - 1];
        const storyId = latestStory._id;

        // ✅ Navigate to that story
        navigate(`/project/${id}/${storyId}`);
      } else {
        navigate(`/project/${id}`);
      }
    } else {
      notification.warning({
        message: "User stories created, but failed to fetch stories.",
      });
      navigate(`/project/${id}`);
    }
  } catch (error) {
    console.error("Error submitting data:", error);
    setLoading(false);
    notification.error({
      message: "Internal Server Error",
    });
  }
};


  const renderEditableField = (team, field, label, icon) => {
    const isEditing = editingTeam === team.id && editingField === field;
    const value = team.data[field] || '';

    return (
      <div style={{ marginBottom: '12px' }}>
        {/* Label Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {icon}
          <span style={{ marginLeft: '4px' }}>{label}</span>
          {!isEditing && (
            <EditOutlined
              style={{
                marginLeft: 'auto',
                cursor: 'pointer',
                color: '#666',
                fontSize: '16px',
              }}
              onClick={() => handleEdit(team.id, field)}
            />
          )}
        </div>

        {/* Editable Mode */}
        {isEditing ? (
          <div>
            <TextArea
              value={tempValues[field]}
              onChange={(e) =>
                setTempValues({ ...tempValues, [field]: e.target.value })
              }
              autoSize={false} // disable autosize
              rows={5} // ~5 lines
              style={{
                fontSize: '14px',
                marginBottom: '6px',
                height: '16.5em', // force ~5 lines height
                lineHeight: '1.5em',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                textAlign: 'center'
              }}
            />
            <Space size="small">
              <Button
                size="small"
                type="primary"
                onClick={() => handleSave(team.id, field)}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditingTeam(null);
                  setEditingField(null);
                  setTempValues({});
                }}
              >
                Cancel
              </Button>
            </Space>
          </div>
        ) : (
          // Read-only Mode
          <div
            style={{
              minHeight: '15.5em', // ~5 lines
              maxHeight: '15.5em',
              padding: '8px',
              backgroundColor: '#fafafa',
              borderRadius: '6px',
              border: '1px dashed #d9d9d9',
              fontSize: '14px',
              lineHeight: '1.5em',
              overflowY: 'auto', // enable vertical scrolling
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              textAlign: 'match-parent'
            }}
          >
            {value || (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Click edit to add {label.toLowerCase()}
              </Text>
            )}
          </div>
        )}
      </div>
    );
  };



  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '16px'
    }}>
      {loading && <FullPageLoader />}
      <div style={{ margin: '0 auto' }}>
        {/* Header Section */}
        {/* <Card
          style={{
            marginBottom: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: 'none'
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <CheckCircleFilled style={{
              color: '#52c41a',
              fontSize: '48px',
              marginBottom: '12px'
            }} />
            <Title level={2} style={{
              marginBottom: '4px',
              fontSize: '24px'
            }}>
              Meeting Completed
            </Title>
            <Text style={{ fontSize: '14px', color: '#666' }}>
              Review team proposals and select your preferred approach
            </Text>
          </div>
        </Card> */}



        {/* Main Content */}
        <Row gutter={[16, 16]}>

          {/* Tab Navigation */}
          <Card
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              // border: '2px solid red',
              width: '99%',
              margin: 'auto'
            }}
            bodyStyle={{ padding: '12px 20px' }}
          >
            <Space>
              <Button
                type={activeTab === 'teams' ? 'primary' : 'default'}
                onClick={() => setActiveTab('teams')}
                icon={<TeamOutlined />}
                size="small"
              >
                Team Proposals
              </Button>
              <Button
                type={activeTab === 'transcript' ? 'primary' : 'default'}
                onClick={() => setActiveTab('transcript')}
                icon={<FileTextOutlined />}
                size="small"
              >
                Transcript
              </Button>
            </Space>
          </Card>


          <Col xs={24} lg={24}>
            <DownloadPDFButtons allTranscripts={allTranscripts} teams={teams} />
            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: 'none',
                minHeight: '500px'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              {activeTab === 'teams' && (
                <div>
                  <Title level={4} style={{ marginBottom: '20px', fontSize: '16px' }}>
                    Select Team Proposal
                  </Title>

                  <Col gutter={[16, 16]} >
                    {teams.map((team) => (
                      <Col xs={24} md={28} key={team.id} style={{ marginBottom: '16px' }}>
                        <Card
                          style={{
                            borderRadius: '8px',
                            border: `2px solid ${team.color}`,
                            backgroundColor: team.bgColor,
                            height: '100%',

                          }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <Title level={5} style={{
                              margin: 0,
                              color: team.color,
                              fontSize: '18px'
                            }}>
                              {team.name}
                            </Title>
                          </div>

                          <div className='md:flex justify-between ' >
                            {/* MVP Field */}
                            <div style={{ marginBottom: '12px' }} className='md:w-[49%]'>
                              {renderEditableField(
                                team,
                                'mvp',
                                'MVP',
                                <TrophyOutlined style={{ color: team.color, fontSize: '12px' }} />,

                                {
                                  maxHeight: '6.5em',
                                  minHeight: '6.5em',
                                  lineHeight: '1.3em',
                                  overflowY: 'auto',
                                  paddingRight: '4px',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }
                              )}
                            </div>
                            {/* Vision Field */}
                            <div style={{ marginBottom: '12px' }} className='md:w-[49%]'>
                              {renderEditableField(
                                team,
                                'vision',
                                'Vision',
                                <EyeOutlined style={{ color: team.color, fontSize: '12px' }} />,

                                {
                                  maxHeight: '6.5em',   // about 5–6 lines (depending on font-size/line-height)
                                  minHeight: '6.5em',   // keeps box fixed
                                  lineHeight: '1.3em',
                                  overflowY: 'auto',
                                  paddingRight: '4px',  // ensures scrollbar doesn’t overlap text
                                  whiteSpace: 'pre-wrap', // preserves line breaks
                                  wordBreak: 'break-word',
                                  fontSize: '39px'
                                }
                              )}
                            </div>


                          </div>

                          {/* Approve Button */}
                          <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={() => handleApprove(team)}
                            disabled={!team.data.vision || !team.data.mvp}
                            block
                            size="small"
                            style={{
                              backgroundColor: team.color,
                              borderColor: team.color,
                              marginTop: '8px',

                            }}
                          >
                            Approve {team.name}
                          </Button>
                        </Card>
                      </Col>
                    ))}
                  </Col>
                </div>
              )}

              {activeTab === 'transcript' && (
                <div>
                  <Title level={4} style={{ marginBottom: '16px', fontSize: '16px' }}>
                    Meeting Transcript
                  </Title>

                  {/* // Updated JSX for rendering */}
                  {allTranscripts.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflow: 'auto', paddingRight: '8px' }}>
                      <Timeline size="small">
                        {allTranscripts.map((item, index) => (
                          // <Timeline.Item
                          //   key={index}
                          //   dot={<TeamOutlined style={{ fontSize: '12px' }} />}
                          // >
                          //   <div style={{ marginBottom: '6px', marginTop: '10px' }}>
                          //     <Space size="small">
                          //       <Tag
                          //         color={
                          //           item.source === 'Local'
                          //             ? 'blue'
                          //             : item.source === 'Remote'
                          //               ? 'green'
                          //               : 'purple'
                          //         }
                          //         style={{ fontSize: '10px', padding: '0 6px' }}
                          //       >
                          //         {/* Display speaker name if available, otherwise fall back to source */}
                          //         {item.speaker || item.source}
                          //       </Tag>
                          //     </Space>
                          //   </div>
                          //   <Paragraph style={{
                          //     margin: 0,
                          //     fontSize: '12px',
                          //     lineHeight: '1.4',
                          //     maxHeight: '5.5em',
                          //     overflowY: 'auto'
                          //   }}>
                          //     {item.message || item.text}
                          //   </Paragraph>
                          // </Timeline.Item>
                          <Timeline.Item
                            key={index}
                            dot={<TeamOutlined style={{ fontSize: '12px' }} />}
                          >
                            <div style={{ marginBottom: '6px', marginTop: '10px' }}>
                              <Space size="small">
                                <Tag
                                  color={
                                    item.source === 'You'
                                      ? 'blue'
                                      : item.source === 'Remote'
                                        ? 'green'
                                        : 'purple'
                                  }
                                  style={{ fontSize: '10px', padding: '0 6px' }}
                                >
                                  {item.speaker || item.source}
                                </Tag>
                                {/* Optional: Display timestamp */}
                                <Text type="secondary" style={{ fontSize: '10px' }}>
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </Text>
                              </Space>
                            </div>
                            <Paragraph style={{
                              margin: 0,
                              fontSize: '12px',
                              lineHeight: '1.4',
                              maxHeight: '5.5em',
                              overflowY: 'auto'
                            }}>
                              {item.message || item.text}
                            </Paragraph>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#999'
                    }}>
                      <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <Text type="secondary">No transcript available</Text>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={24}>


            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: 'none',
                marginBottom: '16px'
              }}
              bodyStyle={{ padding: '16px' }}
            >
              <Title level={5} style={{
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', margin: 'auto', textAlign: 'center' }}>
                  {selectedTeam && (
                    <Text style={{ fontSize: '13px' }}>
                      ✅ {selectedTeam} selected
                    </Text>
                  )}
                </span>
                <br />

                <RocketOutlined style={{ marginRight: '6px' }} />
                Next Steps
              </Title>




              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={handleCreateUserStories}
                  disabled={!isAnyTeamApproved}
                  block
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  Save & Create User Stories
                </Button>

                <Button
                  icon={<DashboardOutlined />}
                  onClick={() => navigate("/")}
                  block
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  Go to Dashboard
                </Button>
              </Space>
            </Card>

          </Col>


          <Row gutter={[16, 16]} style={{ width: '100%', margin: 'auto' }}>
            <Col xs={24} lg={24}>
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: 'none',
                  marginBottom: '16px',
                }}
              >

                <Metrices />
              </Card>
            </Col>

            <Col xs={24} lg={24}>
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: 'none',
                  marginBottom: '16px',
                }}
              >

                <ArtifactScorer />
              </Card>
            </Col>
          </Row>



        </Row>
      </div>
    </div>
  );
};

export default EndMeetingMessage;