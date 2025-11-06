import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProjects,
  fetchUserStories,
  deleteProject,
  setUserStorySelected,
  deleteUserStoryVersion,
  setPrioritization,
  updateProject,
} from "../features/MainSlice.jsx";
import {
  Button,
  message,
  List,
  Card,
  Spin,
  Typography,
  Badge,
  Divider,
  Tag,
  Empty,
  Space,
  Row,
  Col,
  Dropdown,
  Modal,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  DeleteOutlined,
  FolderOpenOutlined,
  ProjectOutlined,
  HistoryOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { setReports } from "../features/ReportSlice.jsx";
import CreateProjectModal from "./CreateProjectModal";
import { Edit, File, Pencil } from "lucide-react";
// import AddConnectorModel from "./AddConnectorPage.jsx";
import { useAuth } from "../../app1/Components/authcontext.jsx";

const { Title, Text } = Typography;
const { confirm } = Modal;

const ProjectList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // For edit mode
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectorProject, setConnectorProject] = useState({ id: null, name: "" });
  const {user} = useAuth()

  // Get state from Redux
  const { projects, userStories, loading, prioritization } = useSelector(
    (state) => state.main
  );

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchUserStories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(setReports([]));
    dispatch(setPrioritization([]));
  }, [dispatch]);

  useEffect(() => {
    // Check if this is a fresh navigation or if we've already reloaded
    const hasReloaded = history.state && history.state.hasReloaded;

    if (!hasReloaded) {
      // Before reloading, update the history state
      const newState = { ...history.state, hasReloaded: true };
      history.replaceState(newState, "");

      // Perform the reload
      window.location.reload();
    }

    // No cleanup needed for this approach
  }, [location.pathname]);

  const handleDeleteProject = (projectId) => {
    console.log("delete projected workinf");

    dispatch(deleteProject(projectId))
      .unwrap()
      .then(() => {
        message.success("Project deleted successfully!");
      })
      .catch((error) => {
        message.error("Failed to delete project: " + error);
      });
  };

  const handleUpdateProject = (projectId, projectName) => {
    console.log("Update projected working", projectId);

    dispatch(updateProject({ id: projectId, project_name: projectName }))
      .unwrap()
      .then(() => {
        message.success("Project updated successfully!");
        dispatch(fetchProjects()); // Refresh the projects list
      })
      .catch((error) => {
        message.error("Failed to update project: " + error);
      });
  };

  const handleDeleteUserStoryVersion = (storyId) => {
    dispatch(deleteUserStoryVersion(storyId))
      .unwrap()
      .then(() => {
        message.success("User story deleted successfully!");
        dispatch(fetchUserStories());
      })
      .catch((error) => {
        message.error("Failed to delete user story: " + error);
      });
  };

  const handleProjectDetail = (project) => {
    navigate(`/project_details/${project.project_name}/${project.id}`);
  };

  const getProjectUserStories = (projectId) => {
    const filteredStories = userStories.filter(
      (story) => story.project_id === projectId
    );

    return filteredStories.map((story, index) => {
      const storyDate = new Date(story.created_at);

      return {
        ...story,
        versionNumber: `Version ${index + 1}`,
        formattedDate: storyDate.toLocaleDateString("en-US"),
        formattedTime: storyDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
    });
  };

  const handleOpenProjectVersion = (project, story) => {
    dispatch(setUserStorySelected(story._id));
    navigate(`/project/${project.id}`);
  };

  const handleOpenProject = (project) => {
    dispatch(setUserStorySelected(null));
    navigate(`/create-meeting/${project.id}`);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsCreateModalVisible(true);
  };


  const getDropdownItems = (project) => [
    {
      key: "details",
      label: <span className="text-green-500 text-xs">Open</span>,
      icon: <File size={14} className="text-green-500" />,
      onClick: () => handleProjectDetail(project),
    },
    {
      key: "edit",
      label: <span className="text-blue-500 text-xs">Edit</span>,
      icon: <Pencil size={14} className="text-blue-500" />,
      onClick: () => handleEditProject(project),
    },
    
    {
      key: "delete",
      label: "Delete Project",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteProject(project.id),
    },
  ];

  const handleModalCancel = () => {
    setIsCreateModalVisible(false);
    setEditingProject(null); // Reset edit mode
  };

  const handleModalSuccess = () => {
    setIsCreateModalVisible(false);
    setEditingProject(null); // Reset edit mode
    dispatch(fetchProjects());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={2} className="text-blue-600 mb-2">
              <ProjectOutlined className="mr-2" />
              My Projects
            </Title>
            <Text type="secondary">Manage your projects and user stories</Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
            className="bg-blue-500 hover:bg-blue-600 border-none shadow-md"
          >
            Create Project
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-lg shadow-sm border border-gray-200">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <Text className="text-lg text-gray-500 block mb-2">
                    No Projects yet
                  </Text>
                  <Text type="secondary">
                    Create your first project to get started
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
                className="bg-blue-500 hover:bg-blue-600 border-none"
              >
                Create Project
              </Button>
            </Empty>
          </div>
        ) : (
          // Projects Grid
          <Row gutter={[24, 24]}>
            {projects.map((project) => {
              const projectStories = getProjectUserStories(project.id);

              return (
                <>
                  <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                    <Card
                      className="h-full shadow-lg transition-shadow duration-300 border-0 rounded-lg"
                      bodyStyle={{ padding: "20px" }}
                      actions={[
                        <Button
                          type="text"
                          icon={<FolderOpenOutlined />}
                          onClick={() => handleProjectDetail(project)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Open Project
                        </Button>,
                      ]}
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <ProjectOutlined className="text-blue-500 mr-2" />
                            <Text strong className="text-lg truncate">
                              {project.project_name}
                            </Text>
                          </div>
                          <Badge
                            count={projectStories.length}
                            style={{ backgroundColor: "#52c41a" }}
                            className="mr-2"
                          />
                          <Text type="secondary" className="text-sm ml-2">
                            meetings
                          </Text>
                        </div>
                        <Dropdown
                          menu={{ items: getDropdownItems(project) }}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            className="text-gray-400 hover:text-gray-600"
                          />
                        </Dropdown>
                      </div>
                    </Card>
                    
                  </Col>
                  
                </>
              );
            })}
          </Row>
        )}

        {/* Create/Edit Project Modal */}
        <CreateProjectModal
          visible={isCreateModalVisible}
          onCancel={handleModalCancel}
          onSuccess={handleModalSuccess}
          editingProject={editingProject}
          onUpdate={handleUpdateProject}
        />
      </div>
      {/* <AddConnectorPage
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={connectorProject.id}
        projectName={connectorProject.name}
      /> */}
    </>
  );
};

export default ProjectList;
