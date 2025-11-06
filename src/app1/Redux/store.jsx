// import { configureStore } from "@reduxjs/toolkit";
// import MainStates_Slice from "../Components/features/mainStates/MainStates_Slice";

// export const store = configureStore({
//   reducer: {
//     MainStates_Slice: MainStates_Slice,
//   },
// });

// export default store;


import { configureStore } from "@reduxjs/toolkit";
import MainStates_Slice from "../Components/features/mainStates/MainStates_Slice";
// import MainSlice from "../features/MainSlice.jsx"; // Import your reducers
import MainSlice from "../../app2/features/MainSlice.jsx";
import TableStoriesResponse from "../../app2/features/TableStoriesResponse.jsx"; // Import your reducers
import reportsReducer from "../../app2/features/ReportSlice.jsx"
import  TeamConfigSlice  from "../Components/features/mainStates/TeamConfigSlice.jsx";

export const store = configureStore({
  reducer: {
    MainStates_Slice: MainStates_Slice,
    main: MainSlice, // Add your reducers here
    tablestoriesresponse: TableStoriesResponse,
    reports: reportsReducer,
    teamConfig: TeamConfigSlice,
  },
});

export default store;
