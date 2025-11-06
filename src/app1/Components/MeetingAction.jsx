import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMeetingStatus } from "./features/mainStates/MainStates_Slice";
import { useRefs } from "./RefProvider";


const MeetingAction = ({ onEndMeeting, onLeaveMeeting, onClose }) => {
    const {
       
        userId,
        
      } = useRefs();
      const roomId = useSelector((state) => state.MainStates_Slice.roomId);

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-center">Meeting Options</h2>
          <p className="text-gray-700 mb-6 text-center">What would you like to do?</p>
          <div className="flex justify-around">
            <button
              onClick={()=>onEndMeeting(roomId, userId)}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              End Meeting
            </button>
            <button
              onClick={()=>onLeaveMeeting(userId)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Leave Meeting
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-4 text-gray-500 hover:text-gray-700 block mx-auto"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };
  

export default MeetingAction;
