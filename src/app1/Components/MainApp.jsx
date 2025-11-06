import { useEffect, useRef, useState } from "react";
import Content from "./Content";
import Rag from "./RAG_process_files/Rag";
import { useDispatch, useSelector } from "react-redux";
import {
  setAgenda,
  setAgent,
  setAgentName,
  setMeetingType,
  setRoomId,
  setIsAdmin,
} from "./features/mainStates/MainStates_Slice";
import { useRefs } from "./RefProvider";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { getSocket } from "./socketInstance";

import { Breadcrumb } from "antd";
import { HomeFilled } from "@ant-design/icons";

function MainApp() {
  const roomId = useSelector((state) => state.MainStates_Slice.roomId);
  const agenda = useSelector((state) => state.MainStates_Slice.agenda);
  const agent = useSelector((state) => state.MainStates_Slice.agent);
  const agentName = useSelector((state) => state.MainStates_Slice.agentName);
  const { project_name, id } = useParams();
  const isAdmin = useSelector((state) => state.MainStates_Slice.isAdmin);
  console.log("project_id", getSocket());

  const textInputRef = useRef(null);
  const socket = getSocket();
  const { setJoinStatus } = useRefs();

  const projects = useSelector((state)=> state.main.projects)
  console.log("Projects", projects);

  const project = projects.find((project) => project.id == id);
  const projectName = project.project_name
  

  // Use useEffect to focus the input after it appears
  useEffect(() => {
    if (agent && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [agent]);

  // const storeSocket = useSelector((state) => state.MainStates_Slice.socket);

  const meetingType = useSelector(
    (state) => state.MainStates_Slice.meetingType
  );
  const { localVideoRef } = useRefs();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [joined] = useState(false);
  console.log("localvideoRef", localVideoRef);

  const location = useLocation();
  console.log("location at main app", location);
  const from = location.state?.from;
  console.log("redirection from", from);

  // useEffect(() => {
  //   // Check if this is a fresh navigation or if we've already reloaded
  //   const hasReloaded = history.state && history.state.hasReloaded;

  //   if (!hasReloaded) {
  //     // Before reloading, update the history state
  //     const newState = { ...history.state, hasReloaded: true };
  //     history.replaceState(newState, "");

  //     // Perform the reload
  //     window.location.reload();
  //   }

  //   // No cleanup needed for this approach
  // }, [location.pathname]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  const handleCheckboxChange = (e) => {
    dispatch(setAgent(e.target.checked));
  };

  const generateMeetingLink = async () => {
    return new Promise((resolve) => {
      const randomString = (length) => {
        const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return result;
      };

      const part1 = randomString(3); // e.g., "yah"
      const part2 = randomString(5); // e.g., "2adch"
      const meetingLink = `${part1}-${part2}`;
      resolve(meetingLink);
    });
  };


  const joinRoom = async () => {
    console.log("join room function", roomId);
    const meetingId = await generateMeetingLink();

    if (agent && agentName.trim()) {
      const finalAgentName = agentName.startsWith("Agent ")
        ? agentName
        : `Agent ${agentName}`;
      dispatch(setAgentName(finalAgentName));
      console.log("Final Agent Name:", finalAgentName);
    }

    setJoinStatus("approved");
    console.log("Generated Meeting Link:", meetingId);
    dispatch(setIsAdmin(true));
    dispatch(setRoomId(meetingId));

    navigate(`/${id}/${meetingId}`);
  };

  const settingAgentName = (e) => {
    e.preventDefault();
    const inputvalue = e.target.value;
    dispatch(setAgentName(inputvalue));
  };

  //   return (

  // <div
  //   className={`flex h-screen bg-gray-800 overflow-hidden ${
  //     !joined && "justify-center items-center"
  //   }`}
  // >
  //   <div className="md:w-[30%] bg-white rounded-lg shadow-lg p-6 space-y-6">
  //     <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
  //       Create Meeting
  //     </h2>
  //     <div className="space-y-4">
  //       {/* Meeting Type Selector */}
  //       <div>
  //         <label className="block text-gray-800 font-medium mb-2">
  //           Select Meeting Type
  //         </label>
  //         <select
  //           value={meetingType}
  //           onChange={(e) => dispatch(setMeetingType(e.target.value))}
  //           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //         >
  //           <option value="Business Meeting">Business Meeting</option>
  //           <option value="Scrum Meeting">Scrum Meeting</option>
  //         </select>
  //       </div>

  //       {/* Meeting Agenda Input */}
  //       <div>
  //       <label className="block text-gray-800 font-medium mb-1">
  //           Meeting Agenda
  //         </label>
  //       <input
  //         type="text"
  //         placeholder="Enter Meeting Agenda"
  //         value={agenda}
  //         onKeyPress={handleKeyPress}
  //         onChange={(e) => dispatch(setAgenda(e.target.value))}
  //         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //       />
  //       </div>
  //     </div>

  //     {/* Add Agent Section */}
  //     <div className="space-y-3">
  //       <div className="flex items-center">
  //         <input
  //           type="checkbox"
  //           id="addAgent"
  //           onChange={handleCheckboxChange}
  //           className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
  //         />
  //         <label htmlFor="addAgent" className="ml-2 text-gray-800 text-sm">
  //           Do you want to add an Agent?
  //         </label>
  //       </div>
  //       {agent && (
  //         <div>
  //           <input
  //             type="text"
  //             ref={textInputRef}
  //             placeholder="Enter Agent Name"
  //             value={agentName}
  //             onKeyPress={handleKeyPress}
  //             onChange={settingAgentName}
  //             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //           />
  //         </div>
  //       )}
  //     </div>

  //     {/* Create Meeting Button */}
  //     <button
  //       onClick={joinRoom}
  //       disabled={
  //         !agenda.trim() || // Disable if agenda is empty
  //         (agent && !agentName.trim()) // Disable if agent is true and agentName is empty
  //       }
  //       className={`w-full font-semibold py-2 px-4 rounded-lg transition duration-150 ${
  //         !agenda.trim() || (agent && !agentName.trim())
  //           ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
  //           : 'bg-blue-600 hover:bg-blue-700 text-white'
  //       }`}
  //       // className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150"
  //     >
  //       Create Meeting
  //     </button>
  //   </div>
  // </div>

  //   );
 const [hasPermissions, setHasPermissions] = useState(false);
   const [permissionStatus, setPermissionStatus] = useState({
     camera: 'prompt',
     microphone: 'prompt'
   });
 
   // Check permissions on component mount
   useEffect(() => {
     checkPermissions();
   }, []);
 
   const checkPermissions = async () => {
     try {
       // Check camera permission
       const cameraPermission = await navigator.permissions.query({ name: 'camera' });
       // Check microphone permission
       const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
 
       const newPermissionStatus = {
         camera: cameraPermission.state,
         microphone: microphonePermission.state
       };
 
       setPermissionStatus(newPermissionStatus);
 
       // Update hasPermissions based on both permissions being granted
       const bothGranted = cameraPermission.state === 'granted' && 
                           microphonePermission.state === 'granted';
       setHasPermissions(bothGranted);
 
       // Listen for permission changes
       cameraPermission.onchange = () => {
         checkPermissions();
       };
 
       microphonePermission.onchange = () => {
         checkPermissions();
       };
 
     } catch (error) {
       console.error('Error checking permissions:', error);
       alert("Error checking permission")
       // Fallback: try to access media to trigger permission prompt
       
     }
   };
  
   const setPermissions = async () => {
     try {
       // Ask for camera + microphone access
       const stream = await navigator.mediaDevices.getUserMedia({
         video: true,
         audio: true,
       });
 
       // Update permission status
       setPermissionStatus({
         camera: "granted",
         microphone: "granted",
       });
       setHasPermissions(true);
 
       // Stop tracks so it doesn't keep camera/mic on
       stream.getTracks().forEach(track => track.stop());
     } catch (err) {
       console.error("Permission denied:", err);
 
       setPermissionStatus({
         camera: "denied",
         microphone: "denied",
       });
       setHasPermissions(false);
     }
   }
    
  const getPermissionText = () => {
     if (permissionStatus.camera === 'denied' || permissionStatus.microphone === 'denied') {
       return "Camera and microphone access denied. Please enable permissions in your browser settings.";
     } else if (!hasPermissions) {
       return "Please allow camera and microphone access to join the meeting.";
     }
     return "";
   };
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Breadcrumb Navigation */}
      {/* <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          {breadcrumbItems.map((item, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-400">{'>'}</span>}
              <span className={index === breadcrumbItems.length - 1 ? 'text-gray-800' : 'text-gray-600'}>
                {item}
              </span>
            </span>
          ))}
        </nav>
      </div> */}
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
            <Link to={from}>{project_name}</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link>Create-Meeting</Link>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="flex justify-center items-center  ">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-300 p-8 ">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Create Meeting
            </h1>
          </div>

          <div className="space-y-6">
            {/* Meeting Type Selector */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Select Meeting Type
              </label>
              <select
                value={meetingType}
                // onChange={(e) => handleMeetingTypeChange(e.target.value)}
                onChange={(e) => dispatch(setMeetingType(e.target.value))}
                className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="Business Meeting">Business Meeting</option>
                <option value="Scrum Meeting">Scrum Meeting</option>
                <option value="Business Meeting">Sprint </option>
                <option value="Scrum Meeting">Retrospective </option>
                <option value="Business Meeting">Leadership </option>
                <option value="Scrum Meeting">Planing meetings</option>
              </select>
            </div>

            {/* Meeting Agenda Input */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Meeting Agenda
              </label>
              <input
                type="text"
                placeholder="Enter meeting agenda"
                value={agenda}
                // onChange={handleAgendaChange}
                // onKeyPress={handleKeyPress}
                onChange={(e) => dispatch(setAgenda(e.target.value))}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Add Agent Section */}
            <div className="space-y-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={agent}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700">
                  Do you want to add an Agent?
                </span>
              </label>

              {agent && (
                <div className="ml-7">
                  <input
                    ref={textInputRef}
                    type="text"
                    placeholder="Enter agent name"
                    value={agentName}
                    onChange={settingAgentName}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Create Meeting Button */}
            <button
              onClick={joinRoom}
              disabled={(!agenda.trim() || (agent && !agentName.trim()) ) && !hasPermissions}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all duration-200 flex items-center justify-center space-x-2 ${
                !agenda.trim() || (agent && !agentName.trim())
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              }
              ${!hasPermissions ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <span>📅</span>
              <span>Create Meeting</span>
            </button>
             {!hasPermissions && (
                    <div className="mt-4 text-center">
                      <p className="text-yellow-400 text-sm max-w-md">
                        {getPermissionText()}
                      </p>
                      <button onClick={setPermissions} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Set Permissions
                      </button>
                      <div className="mt-2 text-xs text-gray-400">
                        <p>Status: Camera - {permissionStatus.camera}, Microphone - {permissionStatus.microphone}</p>
                      </div>
                    </div>
                  )}  
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainApp;

// import { useEffect, useRef, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { useRefs } from "./RefProvider";
// import { useDispatch } from "react-redux";

// function MainApp() {
//   // Demo state management (replace with your Redux logic)
//   const [roomId, setRoomId] = useState('');
//   const [agenda, setAgenda] = useState('');
//   const [agent, setAgent] = useState(false);
//   const [agentName, setAgentName] = useState('');
//   const [meetingType, setMeetingType] = useState('Business Meeting');
//   const [joined] = useState(false);
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const {setJoinStatus } = useRefs();
//   const dispatch = useDispatch();

//   const textInputRef = useRef(null);

//     useEffect(() => {
//     // Check if this is a fresh navigation or if we've already reloaded
//     const hasReloaded = history.state && history.state.hasReloaded;

//     if (!hasReloaded) {
//       // Before reloading, update the history state
//       const newState = { ...history.state, hasReloaded: true };
//       history.replaceState(newState, '');

//       // Perform the reload
//       window.location.reload();
//     }

//     // No cleanup needed for this approach
//   }, [location.pathname]);

//   useEffect(() => {
//     if (agent && textInputRef.current) {
//       textInputRef.current.focus();
//     }
//   }, [agent]);

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") {
//       joinRoom();
//     }
//   };

//   const handleCheckboxChange = (e) => {
//     setAgent(e.target.checked);
//   };

//   const generateMeetingLink = async () => {
//     return new Promise((resolve) => {
//       const randomString = (length) => {
//         const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
//         let result = "";
//         for (let i = 0; i < length; i++) {
//           result += characters.charAt(
//             Math.floor(Math.random() * characters.length)
//           );
//         }
//         return result;
//       };

//       const part1 = randomString(3); // e.g., "yah"
//       const part2 = randomString(5); // e.g., "2adch"
//       const meetingLink = `${part1}-${part2}`;
//       resolve(meetingLink);
//     });
//   };
//     const joinRoom = async () => {
//     console.log("join room function", roomId);
//     const meetingId = await generateMeetingLink();

//     if (agent && agentName.trim()) {
//     const finalAgentName = agentName.startsWith('Agent ') ? agentName : `Agent ${agentName}`;
//     // dispatch(setAgentName(finalAgentName));
//     console.log("Final Agent Name:", finalAgentName);
//   }

//     setJoinStatus("approved")
//     console.log("Generated Meeting Link:", meetingId);
//     sessionStorage.setItem("isAdmin", "true");
//     // dispatch(setRoomId(meetingId));

//     navigate(`/${id}/${meetingId}`);

//   };

//   // const joinRoom = async () => {
//   //   console.log("join room function", roomId);
//   //   const meetingId = await generateMeetingLink();

//   //   if (agent && agentName.trim()) {
//   //     const finalAgentName = agentName.startsWith('Agent ') ? agentName : `Agent ${agentName}`;
//   //     setAgentName(finalAgentName);
//   //     console.log("Final Agent Name:", finalAgentName);
//   //   }

//   //   setJoinStatus("approved")
//   //   console.log("Generated Meeting Link:", meetingId);
//   //   sessionStorage.setItem("isAdmin", "true");
//   //   dispatch(setRoomId(meetingId));

//   //   console.log("Generated Meeting Link:", meetingId);
//   //   setRoomId(meetingId);

//   //   navigate(`/${id}/${meetingId}`);

//   //   // Demo: Show success message
//   //   alert(`Meeting created successfully! Meeting ID: ${meetingId}`);
//   // };

//   const settingAgentName = (e) => {
//     const inputvalue = e.target.value;
//     setAgentName(inputvalue);
//   };

//   const handleMeetingTypeChange = (value) => {
//     setMeetingType(value);
//   };

//   const handleAgendaChange = (e) => {
//     setAgenda(e.target.value);
//   };

//   // Breadcrumb items
//   const breadcrumbItems = [
//     '🏠',
//     'Requirements',
//     'Create-Meeting'
//   ];

//   return (
//     <div className="max-w-7xl mx-auto px-6 py-12">
//       {/* Breadcrumb Navigation */}
//       <div className="mb-8">
//         <nav className="flex items-center space-x-2 text-sm text-gray-600">
//           {breadcrumbItems.map((item, index) => (
//             <span key={index} className="flex items-center">
//               {index > 0 && <span className="mx-2 text-gray-400">{'>'}</span>}
//               <span className={index === breadcrumbItems.length - 1 ? 'text-gray-800' : 'text-gray-600'}>
//                 {item}
//               </span>
//             </span>
//           ))}
//         </nav>
//       </div>

//       {/* Main Content */}
//       <div className="flex justify-center items-center  ">
//         <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-300 p-8 ">
//           <div className="text-center mb-8">
//             <h1 className="text-2xl font-semibold text-gray-800 mb-2">Create Meeting</h1>
//           </div>

//           <div className="space-y-6">
//             {/* Meeting Type Selector */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-3">Select Meeting Type</label>
//               <select
//                 value={meetingType}
//                 onChange={(e) => handleMeetingTypeChange(e.target.value)}
//                 className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//               >
//                 <option value="Business Meeting">Business Meeting</option>
//                 <option value="Scrum Meeting">Scrum Meeting</option>
//               </select>
//             </div>

//             {/* Meeting Agenda Input */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-3">Meeting Agenda</label>
//               <input
//                 type="text"
//                 placeholder="Enter meeting agenda"
//                 value={agenda}
//                 onChange={handleAgendaChange}
//                 onKeyPress={handleKeyPress}
//                 className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//               />
//             </div>

//             {/* Add Agent Section */}
//             <div className="space-y-4">
//               <label className="flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={agent}
//                   onChange={handleCheckboxChange}
//                   className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
//                 />
//                 <span className="ml-3 text-gray-700">Do you want to add an Agent?</span>
//               </label>

//               {agent && (
//                 <div className="ml-7">
//                   <input
//                     ref={textInputRef}
//                     type="text"
//                     placeholder="Enter agent name"
//                     value={agentName}
//                     onChange={settingAgentName}
//                     onKeyPress={handleKeyPress}
//                     className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Create Meeting Button */}
//             <button
//               onClick={joinRoom}
//               disabled={
//                 !agenda.trim() ||
//                 (agent && !agentName.trim())
//               }
//               className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all duration-200 flex items-center justify-center space-x-2 ${
//                 !agenda.trim() || (agent && !agentName.trim())
//                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                   : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
//               }`}
//             >
//               <span>📅</span>
//               <span>Create Meeting</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default MainApp;
