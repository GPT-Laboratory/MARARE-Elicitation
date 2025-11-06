import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { socketURL } from "../../app1/Components/socketInstance";
import { getUserId } from "../components/GetLoginUserId";


// Async thunk to fetch all reports for a selected user story
export const fetchAllReports = createAsyncThunk(
    "reports/fetchAllReports",
    async (selectedUserStoryId, { rejectWithValue }) => {
        const userId = getUserId();
        if (!userId) {
            return rejectWithValue("User not logged in");
        }
        try {
            const response = await fetch(`${socketURL}/get-meeting-reports/${selectedUserStoryId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched reports:", data.reports);
            return data.reports;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);


export const fetchAllReportsByUserId = createAsyncThunk(
    "main/fetchAllReportsByUserId",
    async (_, { rejectWithValue }) => {
        const userId = getUserId();
        if (!userId) {
            return rejectWithValue("User not logged in");
        }
        try {
            const response = await fetch(`${socketURL}/get-all-reports-by-user-id?user_id=${userId}`);
            //   console.log("response.data", response);
            const data = await response.json();
            console.log("Fetched reports:", data.reports);
            return data.reports || []; // Ensure it returns an array
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch reports");
        }
    }
);

const ReportSlice = createSlice({
    name: "reports",
    initialState: {
        reports: [],
        allReports: [],
        loading: false,
        error: null,
        docxFiles: [], // Array to store multiple DOCX files if needed
        intervalId: null, // will store setInterval id
        isActive: false,
        teamA: { vision: "", mvp: "" },
        teamB: { vision: "", mvp: "" },
        teamC: { vision: "", mvp: "" },
    },
    reducers: {
        startAutoSend: (state, action) => {
            // Clear existing interval first if any
            if (state.intervalId) {
                clearInterval(state.intervalId);
            }
            state.intervalId = action.payload; // store new setInterval id
            state.isActive = true;
            console.log("Redux: Auto-send started with interval:", action.payload);
        },
        stopAutoSend: (state) => {
            console.log("Redux: Stopping auto-send, current interval:", state.intervalId);

            if (state.intervalId) {
                clearInterval(state.intervalId);
                console.log("Redux: Interval cleared");
            }

            state.intervalId = null;
            state.isActive = false;
            console.log("Redux: Auto-send stopped");
        },
        // Add this if you want to force-clear from outside
        forceStopAutoSend: (state) => {
            console.log("Redux: Force stopping auto-send");

            if (state.intervalId) {
                clearInterval(state.intervalId);
            }

            state.intervalId = null;
            state.isActive = false;
        },
        setTeamAmvp: (state, action) => {
            state.teamA.mvp = action.payload;
        },
        setTeamAvision: (state, action) => {
            state.teamA.vision = action.payload;
        },
        setTeamBmvp: (state, action) => {
            state.teamB.mvp = action.payload;
        },
        setTeamBvision: (state, action) => {
            state.teamB.vision = action.payload;
        },
        setTeamCmvp: (state, action) => {
            state.teamC.mvp = action.payload;
        },
        setTeamCvision: (state, action) => {
            state.teamC.vision = action.payload;
        },
        clearReports: (state) => {
            state.reports = [];
            state.error = null;
        },
        setReports: (state, action) => {
            state.reports = action.payload;
            console.log("reports set", state.reports);

            state.error = null;
        },
        setDocxFile: (state, action) => {
            // If file with same ID exists, replace it; otherwise, add new
            const existingIndex = state.docxFiles.findIndex(file => file.id === action.payload.id);
            if (existingIndex !== -1) {
                state.docxFiles[existingIndex] = action.payload;
            } else {
                state.docxFiles.push(action.payload);
            }
        },
        removeDocxFile: (state, action) => {
            // Remove file by ID
            state.docxFiles = state.docxFiles.filter(file => file.id !== action.payload);
        },
        clearDocxFiles: (state) => {
            state.docxFiles = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllReports.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllReports.fulfilled, (state, action) => {
                state.loading = false;
                state.reports = action.payload;
                console.log("reports comes", state.reports);

            })
            .addCase(fetchAllReports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Reports
            .addCase(fetchAllReportsByUserId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllReportsByUserId.fulfilled, (state, action) => {
                state.loading = false;
                state.allReports = action.payload;
                state.error = null;
            })
            .addCase(fetchAllReportsByUserId.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
    },
});

export const { clearReports, setReports, setDocxFile, removeDocxFile, clearDocxFiles, startAutoSend, stopAutoSend,
    setTeamAmvp,
    setTeamAvision,
    setTeamBmvp,
    setTeamBvision,
    setTeamCmvp,
    setTeamCvision,
} = ReportSlice.actions;
export default ReportSlice.reducer;
