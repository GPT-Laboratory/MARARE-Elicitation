// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
// import {
//   Button,
//   Card,
//   Typography,
//   Spin,
//   message,
//   Empty,
//   List,
//   Avatar,
//   Dropdown,
//   Space,
//   Input,
//   Breadcrumb,
// } from "antd";
// import {
//   PlusOutlined,
//   HomeOutlined,
//   EllipsisOutlined,
//   UserOutlined,
//   CalendarOutlined,
//   ProjectOutlined,
//   SearchOutlined,
//   DeleteOutlined,
//   HomeFilled,
// } from "@ant-design/icons";
// import { socketURL } from "../app1/Components/socketInstance";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   deleteUserStoryVersion,
//   fetchUserStories,
//   setUserStorySelected,
// } from "../app2/features/MainSlice";
// import { File, Pencil } from "lucide-react";

// const { Title, Text } = Typography;
// const { Search } = Input;

// const ProjectDetails = () => {
//   const { project_name , id } = useParams();
//   const [userStories, setUserStories] = useState([]);
//   const [filteredStories, setFilteredStories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();
//   console.log("project id", id);
//   const projects = useSelector((state) => state.main.projects);
//   // console.log("projects", projects);

//   const project = projects.find((project) => project.id == id);
//   console.log("this project", project);


  
//   // const projectName = project.project_name;
//   console.log("project Name", project_name);


//   // Add this function
//     const fetchExistingConfigurations = async () => {
//       if (!id) return;
  
//       try {
//         // setLoadingConfigurations(true);
//         const response = await fetch(`${socketURL}/mcp/configurations/${id}`);
//         // const data = await response.json();
//         console.log("Response status:", response);
        
  
  
//       } catch (error) {
//         console.error("Error fetching existing configurations:", error);
//         message.error("Failed to load existing configurations");
//       } finally {
//         // setLoadingConfigurations(false);
//       }
//     };
  
//     // Update your existing useEffect to call this function
//     useEffect(() => {
//       // fetchTools();
//       fetchExistingConfigurations(); // Add this line
//     }, [id]);


   

//   const handleDeleteUserStoryVersion = (storyId) => {
//     dispatch(deleteUserStoryVersion(storyId))
//       .unwrap()
//       .then(() => {
//         message.success("User story deleted successfully!");
//         dispatch(fetchUserStories());
//       })
//       .catch((error) => {
//         message.error("Failed to delete user story: " + error);
//       });
//   };

//   const handleOpenProjectVersion = (id, storyId) => {
//     dispatch(setUserStorySelected(storyId));
//     navigate(`/project/${id}/${storyId}`);
//   };

  

//   useEffect(() => {
//     const fetchUserStories = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(`${socketURL}/project_user_stories/${id}`);

//         console.log("Response status:", response.status);
//         console.log("Response ok:", response.ok);

//         const data = await response.json();
//         console.log("Parsed data:", data);

//         let itemCount = 0;

//         if (Array.isArray(data)) {
//           itemCount = data.length;
//           setUserStories(data);
//           setFilteredStories(data); // Initialize filtered stories
//         }

//         console.log(`Found ${itemCount} items for project_id: ${id}`);
//         console.log("Items:", data);
//       } catch (err) {
//         console.error("Error fetching user stories:", err);
//         setError(err.message);
//         message.error("Failed to load user stories");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) {
//       fetchUserStories();
//     }
//   }, [id]);

//   // Handle search functionality
//   const handleSearch = (value) => {
//     setSearchTerm(value);
//     if (!value.trim()) {
//       setFilteredStories(userStories);
//     } else {
//       const filtered = userStories.filter(
//         (story) =>
//           story.agenda &&
//           story.agenda.toLowerCase().includes(value.toLowerCase())
//       );
//       setFilteredStories(filtered);
//     }
//   };

//   // Handle start instant meeting
//   const handleStartInstantMeeting = () => {
//     message.info("Starting instant meeting...");
//     dispatch(setUserStorySelected(null)); // Clear selected story
//     navigate(`/create-meeting/${project_name}/${id}`, { state: { from: location.pathname } });
//   };

//   // Dropdown menu items for story actions
//   const getDropdownItems = (storyId) => [
//     {
//       key: "open",
//       label: <span className="text-green-500 text-xs">Open</span>,
//       icon: <File size={14} className="text-green-500" />,
//       onClick: () => handleOpenProjectVersion(id, storyId),
//       // onClick: () => handleDeleteUserStoryVersion(storyId)
//     },
//     {
//       key: "edit",
//       label: <span className="text-blue-500 text-xs">Edit</span>,
//       icon: <Pencil size={14} className="text-blue-500" />,
//       onClick: () => message.info(`Edit story ${storyId}`),
//     },
//     {
//       key: "delete",
//       label: "Delete Story",
//       danger: true,
//       icon: <DeleteOutlined />,
//       onClick: () => handleDeleteUserStoryVersion(storyId),
//     },
//   ];

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[400px]">
//         <Spin size="large" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center min-h-[400px]">
//         <Text type="danger">Error: {error}</Text>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//         <div>
//           <Breadcrumb
//             style={{
//               margin: "20px",
//               marginLeft: "40px",
//             }}
//           >
//             <Breadcrumb.Item>
//               <HomeFilled />
//               <Link to="/">Projects List</Link>
//             </Breadcrumb.Item>
//             <Breadcrumb.Item>
//               <Link>{project_name}</Link>
//             </Breadcrumb.Item>
//           </Breadcrumb>
//         </div>
//         <Button
//           type="primary"
//           icon={<PlusOutlined />}
//           onClick={handleStartInstantMeeting}
//           className="w-full sm:w-auto"
//         >
//           Start an Instant Meeting
//         </Button>
//       </div>

//       {/* Main Content */}
//       <Card className="w-full shadow-sm">
//         {userStories.length === 0 ? (
//           // Empty State Design (First Box)
//           <div className="flex flex-col items-center justify-center py-12 px-4 ">
//             <Empty
//               image={Empty.PRESENTED_IMAGE_SIMPLE}
//               description={
//                 <div className="text-center">
//                   <Title level={4} className="text-gray-600 mb-2">
//                     No User Stories yet
//                   </Title>
//                   <Text className="text-gray-500">
//                     Create your first user story to get started
//                   </Text>
//                 </div>
//               }
//             />
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               size="large"
//               className="mt-6"
//               onClick={handleStartInstantMeeting}
//             >
//               Start an Instant Meeting
//             </Button>
//           </div>
//         ) : (
//           // Stories List Design (Second Box)
//           <div>
//             {/* Search Bar - Only shown when list is available */}
//             <div className="mb-6">
//               <Search
//                 placeholder="Search by agenda..."
//                 allowClear
//                 size="large"
//                 prefix={<SearchOutlined />}
//                 onSearch={handleSearch}
//                 onChange={(e) => handleSearch(e.target.value)}
//                 className="max-w-md"
//               />
//             </div>

//             {/* Show filtered results count */}
//             {searchTerm && (
//               <div className="mb-4">
//                 <Text className="text-gray-500">
//                   {filteredStories.length} of {userStories.length} stories found
//                 </Text>
//               </div>
//             )}

//             {/* Stories List */}
//             {filteredStories.length === 0 && searchTerm ? (
//               // No search results
//               <div className="text-center py-8 ">
//                 <Empty
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   description={
//                     <Text className="text-gray-500">
//                       No stories found matching "{searchTerm}"
//                     </Text>
//                   }
//                 />
//               </div>
//             ) : (
//               <List
//                 className="px-4 "
//                 dataSource={filteredStories}
//                 renderItem={(story, index) => (
//                   <List.Item
//                     key={story._id || index}
//                     className="border border-gray-300 shadow-sm rounded-md p-2   hover:bg-gray-50 transition-colors duration-200"
//                     actions={[
//                       <Dropdown
//                         menu={{ items: getDropdownItems(story._id) }}
//                         trigger={["click"]}
//                         key="more"
//                       >
//                         <Button
//                           type="text"
//                           icon={<EllipsisOutlined />}
//                           className="text-gray-500"
//                         />
//                       </Dropdown>,
//                     ]}
//                   >
//                     <List.Item.Meta
//                       className="p-2 flex justify-center items-center"
//                       avatar={
//                         <Avatar
//                           icon={<ProjectOutlined />}
//                           className="bg-blue-500"
//                         />
//                       }
//                       title={
//                         <div className="flex flex-col  sm:flex-row sm:items-center sm:justify-between gap-2 ">
//                           <Text strong className="text-base">
//                             {story.agenda || `User Story ${index + 1}`}
//                           </Text>
//                           <div className="flex items-center gap-4 text-sm text-gray-500">
//                             {story.assignee && (
//                               <Space size={4}>
//                                 <UserOutlined />
//                                 <Text className="text-gray-500">
//                                   {story.assignee}
//                                 </Text>
//                               </Space>
//                             )}
//                             {story.dueDate && (
//                               <Space size={4}>
//                                 <CalendarOutlined />
//                                 <Text className="text-gray-500">
//                                   {story.dueDate}
//                                 </Text>
//                               </Space>
//                             )}
//                           </div>
//                         </div>
//                       }
                     
//                     />
//                   </List.Item>
//                 )}
//               />
//             )}
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// };

// export default ProjectDetails;




import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Typography,
  Spin,
  message,
  Empty,
  List,
  Avatar,
  Dropdown,
  Space,
  Input,
  Breadcrumb,
} from "antd";
import {
  PlusOutlined,
  HomeOutlined,
  EllipsisOutlined,
  UserOutlined,
  CalendarOutlined,
  ProjectOutlined,
  SearchOutlined,
  DeleteOutlined,
  HomeFilled,
} from "@ant-design/icons";
import { socketURL } from "../app1/Components/socketInstance";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteUserStoryVersion,
  fetchUserStories,
  setUserStorySelected,
} from "../app2/features/MainSlice";
import { File, Pencil } from "lucide-react";

const { Title, Text } = Typography;
const { Search } = Input;

const ProjectDetails = () => {
  const { project_name , id } = useParams();
  const [userStories, setUserStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  console.log("project id", id);
  const projects = useSelector((state) => state.main.projects);
  // console.log("projects", projects);

  const project = projects.find((project) => project.id == id);
  console.log("this project", project);

  
  // const projectName = project.project_name;
  console.log("project Name", project_name);

  // Function to sort stories by created_at in descending order (latest first)
  const sortStoriesByDate = (stories) => {
    return [...stories].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA; // Descending order (latest first)
    });
  };

  // Add this function
  const fetchExistingConfigurations = async () => {
    if (!id) return;

    try {
      // setLoadingConfigurations(true);
      const response = await fetch(`${socketURL}/mcp/configurations/${id}`);
      // const data = await response.json();
      console.log("Response status:", response);
      

    } catch (error) {
      console.error("Error fetching existing configurations:", error);
      message.error("Failed to load existing configurations");
    } finally {
      // setLoadingConfigurations(false);
    }
  };

  // Update your existing useEffect to call this function
  useEffect(() => {
    // fetchTools();
    fetchExistingConfigurations(); // Add this line
  }, [id]);

  const handleDeleteUserStoryVersion = (storyId) => {
    dispatch(deleteUserStoryVersion(storyId))
      .unwrap()
      .then(() => {
        message.success("User story deleted successfully!");
        dispatch(fetchUserStories());
        fetchUserStories();
        
      })
      .catch((error) => {
        message.error("Failed to delete user story: " + error);
      });
  };

  const handleOpenProjectVersion = (id, storyId) => {
    dispatch(setUserStorySelected(storyId));
    navigate(`/project/${id}/${storyId}`);
  };

  // Handle clicking on a story item
  const handleStoryClick = (storyId) => {
    console.log("Story clicked:", storyId);
    
    handleOpenProjectVersion(id, storyId);
  };

  const fetchUserStories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${socketURL}/project_user_stories/${id}`);

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        const data = await response.json();
        console.log("Parsed data:", data);

        let itemCount = 0;

        if (Array.isArray(data)) {
          itemCount = data.length;
          // Sort the stories by created_at before setting state
          const sortedStories = sortStoriesByDate(data);
          setUserStories(sortedStories);
          setFilteredStories(sortedStories); // Initialize filtered stories with sorted data
        }

        console.log(`Found ${itemCount} items for project_id: ${id}`);
        console.log("Items:", data);
      } catch (err) {
        console.error("Error fetching user stories:", err);
        setError(err.message);
        message.error("Failed to load user stories");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    

    if (id) {
      fetchUserStories();
    }
  }, [id]);

  // Handle search functionality
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredStories(userStories);
    } else {
      const filtered = userStories.filter(
        (story) =>
          story.agenda &&
          story.agenda.toLowerCase().includes(value.toLowerCase())
      );
      // Keep the filtered results sorted by date
      setFilteredStories(sortStoriesByDate(filtered));
    }
  };

  // Handle start instant meeting
  const handleStartInstantMeeting = () => {
    message.info("Starting instant meeting...");
    dispatch(setUserStorySelected(null)); // Clear selected story
    navigate(`/create-meeting/${project_name}/${id}`, { state: { from: location.pathname } });
  };

  // Dropdown menu items for story actions
  const getDropdownItems = (storyId) => [
    // {
    //   key: "open",
    //   label: <span className="text-green-500 text-xs">Open</span>,
    //   icon: <File size={14} className="text-green-500" />,
    //   onClick: () => handleOpenProjectVersion(id, storyId),
    //   // onClick: () => handleDeleteUserStoryVersion(storyId)
    // },
    // {
    //   key: "edit",
    //   label: <span className="text-blue-500 text-xs">Edit</span>,
    //   icon: <Pencil size={14} className="text-blue-500" />,
    //   onClick: () => message.info(`Edit story ${storyId}`),
    // },
    {
      key: "delete",
      label: "Delete Story",
      danger: true,
      icon: <DeleteOutlined />,
      onClick: () => handleDeleteUserStoryVersion(storyId),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Text type="danger">Error: {error}</Text>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Breadcrumb
            style={{
              margin: "20px",
              marginLeft: "40px",
            }}
          >
            <Breadcrumb.Item>
              <HomeFilled />
              <Link to="/">Projects List</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link>{project_name}</Link>
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleStartInstantMeeting}
          className="w-full sm:w-auto"
        >
          Start an Instant Meeting
        </Button>
      </div>

      {/* Main Content */}
      <Card className="w-full shadow-sm">
        {userStories.length === 0 ? (
          // Empty State Design (First Box)
          <div className="flex flex-col items-center justify-center py-12 px-4 ">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <Title level={4} className="text-gray-600 mb-2">
                    No User Stories yet
                  </Title>
                  <Text className="text-gray-500">
                    Create your first user story to get started
                  </Text>
                </div>
              }
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="mt-6"
              onClick={handleStartInstantMeeting}
            >
              Start an Instant Meeting
            </Button>
          </div>
        ) : (
          // Stories List Design (Second Box)
          <div>
            {/* Search Bar - Only shown when list is available */}
            <div className="mb-6">
              <Search
                placeholder="Search by agenda..."
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Show filtered results count */}
            {searchTerm && (
              <div className="mb-4">
                <Text className="text-gray-500">
                  {filteredStories.length} of {userStories.length} stories found
                </Text>
              </div>
            )}

            {/* Stories List */}
            {filteredStories.length === 0 && searchTerm ? (
              // No search results
              <div className="text-center py-8 ">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text className="text-gray-500">
                      No stories found matching "{searchTerm}"
                    </Text>
                  }
                />
              </div>
            ) : (
              <List
                className="px-4"
                dataSource={filteredStories}
                renderItem={(story, index) => (
                  <List.Item
                    key={story._id || index}
                    className="border border-gray-300 shadow-sm rounded-md p-2 mb-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    style={{ marginBottom: '16px' }} // Additional space between items
                    onClick={() => handleStoryClick(story._id)} // Handle click on entire item
                    actions={[
                      <Dropdown
                        menu={{ items: getDropdownItems(story._id),
                          onClick: (e) => {
      e.domEvent.stopPropagation(); // 👈 this is the key
    },
                         }}
                        trigger={["click"]}
                        key="more"
                        // onClick={(e) => e.stopPropagation()} // Prevent triggering the item click
                        
                      >
                        <Button
                          type="text"
                          icon={<EllipsisOutlined />}
                          className="text-gray-500"
                          onClick={(e) => e.stopPropagation()} // Prevent triggering the item click
                        />
                      </Dropdown>,
                    ]}
                  >
                    <List.Item.Meta
                      className="p-2 flex justify-center items-center"
                      avatar={
                        <Avatar
                          icon={<ProjectOutlined />}
                          className="bg-blue-500"
                        />
                      }
                      title={
                        <div className="flex flex-col  sm:flex-row sm:items-center sm:justify-between gap-2 ">
                          <Text strong className="text-base">
                            {story.agenda || `User Story ${index + 1}`}
                          </Text>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {story.assignee && (
                              <Space size={4}>
                                <UserOutlined />
                                <Text className="text-gray-500">
                                  {story.assignee}
                                </Text>
                              </Space>
                            )}
                            {story.dueDate && (
                              <Space size={4}>
                                <CalendarOutlined />
                                <Text className="text-gray-500">
                                  {story.dueDate}
                                </Text>
                              </Space>
                            )}
                            {/* Display creation date for reference */}
                            {story.created_at && (
                              <Space size={4}>
                                <CalendarOutlined />
                                <Text className="text-gray-500">
                                  Created: {new Date(story.created_at).toLocaleDateString()}
                                </Text>
                              </Space>
                            )}
                          </div>
                        </div>
                      }
                     
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProjectDetails;