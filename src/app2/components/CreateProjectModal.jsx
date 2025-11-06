


import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createProject } from "../features/MainSlice.jsx";
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Space,
} from "antd";
import {
  ProjectOutlined,
  PlusOutlined,
  EditOutlined,
  
} from "@ant-design/icons";
// import AddConnectorModel from "./AddConnectorPage.jsx";

const CreateProjectModal = ({ visible, onCancel, onSuccess, editingProject, onUpdate }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { loading } = useSelector((state) => state.main);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isEditMode = !!editingProject;

  // Pre-populate form when editing
  useEffect(() => {
    if (editingProject && visible) {
      form.setFieldsValue({
        projectName: editingProject.project_name
      });
    } else if (!visible) {
      form.resetFields();
    }
  }, [editingProject, visible, form]);

  const handleCreateProject = async (values) => {
    try {
      await dispatch(createProject(values.projectName)).unwrap();
      message.success("Project created successfully!");
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      message.error("Failed to create project: " + error);
    }
  };

  const handleUpdateProject = async (values) => {
    
    try {
      await onUpdate(editingProject.id, values.projectName);
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      message.error("Failed to update project: " + error);
    }
  };

  const handleSubmit = (values) => {
    if (isEditMode) {
      handleUpdateProject(values);
    } else {
      handleCreateProject(values);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  return (
    <>
    <Modal
      title={
        <Space className="text-lg">
          {isEditMode ? (
            <>
              <EditOutlined className="text-blue-500" />
              <span>Edit Project</span>
            </>
          ) : (
            <>
              <PlusOutlined className="text-blue-500" />
              <span>Create New Project</span>
            </>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={500}
      className="create-project-modal"
      styles={{
        header: {
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '20px',
          paddingBottom: '16px'
        }
      }}
    >
      <div className="py-2">
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            label={ 
              <span className="text-sm font-medium text-gray-700">
                Project Name
              </span>
            }
            name="projectName"
            rules={[
              { 
                required: true, 
                message: "Please enter a project name" 
              },
              {
                min: 2,
                message: "Project name must be at least 2 characters"
              },
              {
                max: 50,
                message: "Project name cannot exceed 50 characters"
              }
            ]}
          >
            <Input
              placeholder="Enter your project name"
              prefix={<ProjectOutlined className="text-gray-400" />}
              className="rounded-md"
              autoFocus
            />
          </Form.Item>

          <div className="text-center mt-6">
            <Space size="middle">
              <Button
                size="large"
                onClick={handleCancel}
                className="min-w-20 rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={isEditMode ? <EditOutlined /> : <PlusOutlined />}
                className="min-w-32 bg-blue-500 hover:bg-blue-600 border-none rounded-md"
              >
                {isEditMode ? 'Update Project' : 'Create Project'}
              </Button>
              {/* <Button
              onClick={() => setIsModalOpen(true)}>
                 {<PlusOutlined/>} Add Connector
              </Button> */}
            </Space>
          </div>
        </Form>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-start">
            <ProjectOutlined className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                {isEditMode ? 'Editing Project' : 'Getting Started'}
              </p>
              <p className="text-xs text-blue-600 leading-relaxed">
                {isEditMode 
                  ? 'Update your project name. This will change how your project appears throughout the application.'
                  : 'Create a project to organize your user stories and requirements. You can add multiple versions and track changes over time.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
     {/* <AddConnectorPage
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectName="My Project"
      /> */}
    </>
  );
};

export default CreateProjectModal;