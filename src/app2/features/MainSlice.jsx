import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getUserId } from "../components/GetLoginUserId.jsx";
import { socketURL } from "../../app1/Components/socketInstance.jsx";

// Async thunks for API interactions
export const fetchProjects = createAsyncThunk(
  "main/fetchProjects",
  async (_, { rejectWithValue }) => {
    const userId = getUserId();
    if (!userId) {
      return rejectWithValue("User not logged in");
    }
    try {
      // const response = await axios.get(`/api/projects?user_id=${userId}`);
      const response = await axios.get(`${socketURL}/projects?user_id=${userId}`);
      console.log("response.data", response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch projects");
    }
  }
);

export const fetchUserStories = createAsyncThunk(
  "main/fetchUserStories",
  async (_, { rejectWithValue }) => {
    const userId = getUserId();
    if (!userId) {
      return rejectWithValue("User not logged in");
    }
    try {
      // const response = await axios.get("/api/user_stories");
      const response = await axios.get(`${socketURL}/user_stories?user_id=${userId}`);
      console.log("response.data", response.data);
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch user stories");
    }
  }
);

export const createProject = createAsyncThunk(
  "main/createProject",
  async (projectName, { rejectWithValue }) => {
    const userId = getUserId();
    if (!userId) {
      return rejectWithValue("User not logged in");
    }
    try {
      // const response = await axios.post("/api/create-project", {
      const response = await axios.post(`${socketURL}/create-project`, {
        project_name: projectName,
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to create project");
    }
  }
);

export const deleteProject = createAsyncThunk(
  "main/deleteProject",
  async (projectId, { rejectWithValue }) => {
    try {
      await axios.delete(`${socketURL}/delete-project/${projectId}`);
      return projectId;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to delete project");
    }
  }
);




export const updateProject = createAsyncThunk(
  "main/updateProject",
  async ({ id, project_name }, { rejectWithValue }) => {
    const userId = getUserId();
    if (!userId) {
      return rejectWithValue("User not logged in");
    }
    try {
      const response = await axios.put(`${socketURL}/update-project/${id}`, {
        project_name: project_name,
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update project");
    }
  }
);


export const deleteUserStoryVersion = createAsyncThunk(
  "main/deleteUserStoryVersion",
  async (storyId, { rejectWithValue }) => {
    try {
      await axios.delete(`${socketURL}/delete-user-story-version/${storyId}`);
      return storyId;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to delete user story");
    }
  }
);

export const fetchFinalTablePrioritization = createAsyncThunk(
  "finalTable/fetchByStoryId",
  async (storyId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${socketURL}/get-final-table-prioritization/${storyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFinalPrioritization = createAsyncThunk(
  "finalResponse/fetchByStoryId",
  async (storyId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${socketURL}/get-final-prioritization/${storyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  counter: 0,
  projects: [],
  userStories: [],
  prioritization: [],
  prioritization_response: [],
  user_story_selected: null,
  loading: false,
  error: null,
};

const MainSlice = createSlice({
  name: "main",
  initialState,
  reducers: {
    increment: (state) => {
      state.counter += 1;
    },
    decrement: (state) => {
      state.counter -= 1;
    },
    setUserStorySelected: (state, action) => {
      state.user_story_selected = action.payload; // Update selected story
      console.log("story _ id:", state.user_story_selected);

    },
    setPrioritization: (state, action) => {
      state.prioritization = action.payload; // Update prioritization data
      console.log("prioritization", state.prioritization);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch User Stories
      .addCase(fetchUserStories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserStories.fulfilled, (state, action) => {
        state.loading = false;
        state.userStories = action.payload;
        console.log("userStories", state.userStories);

        state.error = null;
      })
      .addCase(fetchUserStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
        state.error = null;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(project => project.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        // Find project by _id and update it
        const updatedProject = action.payload;
        const index = state.projects.findIndex(proj => proj._id === updatedProject._id);

        if (index !== -1) {
          state.projects[index] = updatedProject;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // Delete User Story
      .addCase(deleteUserStoryVersion.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUserStoryVersion.fulfilled, (state, action) => {
        state.loading = false;
        state.userStories = state.userStories.filter(story => story.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteUserStoryVersion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetch final_prioritization_table
      .addCase(fetchFinalTablePrioritization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinalTablePrioritization.fulfilled, (state, action) => {
        state.loading = false;
        state.prioritization = action.payload;
        console.log(state.prioritization);

      })
      .addCase(fetchFinalTablePrioritization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetch final_response 
      // fetch final_prioritization_table
      .addCase(fetchFinalPrioritization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinalPrioritization.fulfilled, (state, action) => {
        state.loading = false;
        state.prioritization_response = action.payload;
        console.log(state.prioritization_response);

      })
      .addCase(fetchFinalPrioritization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { increment, decrement, setUserStorySelected, setPrioritization } = MainSlice.actions;
export default MainSlice.reducer;