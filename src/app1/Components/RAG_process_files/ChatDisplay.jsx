import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ChatDisplay = ({ chatHistory }) => {
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isLoading]);

  // Detect changes in chat history to manage loading state
  useEffect(() => {
    // If the last message has a query but no response, show the loading indicator
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      setIsLoading(lastMessage.query && !lastMessage.response);
    }
  }, [chatHistory]);

  const back=()=>{
    navigate('/')
  }

  return (
    <div className="px-2 md:px-0 max-w-xl md:w-[50%] rounded-lg h-screen pt-10 bg-gray-800">
      <button
          onClick={back}
          className={ ` bg-gray-800 absolute left-2 top-2 border w-6 h-6 p-1 flex items-center justify-center rounded-full  transition-transform duration-300`}
        >
           <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-white"
            >
              <path
                fill-rule="evenodd"
                d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z"
                clip-rule="evenodd"
              />
            </svg>
        </button>
      {chatHistory.length === 0 ? (
        <p className="text-gray-500 text-center mt-4 italic">No messages yet...</p>
      ) : (
        <div className="space-y-6 pb-24">
          {chatHistory.map((chat, index) => (
            <div key={index} className="flex flex-col space-y-4">
              {/* User Query - Right side */}
              {chat.query && (
                <div className="flex justify-end">
                  <div
                    className="bg-blue-600 text-white rounded-2xl rounded-tr-none 
                    px-6 py-3 max-w-md shadow-md hover:shadow-lg transition-shadow
                    text-sm md:text-base"
                  >
                    {chat.query}
                  </div>
                </div>
              )}

              {/* Bot Response - Left side */}
              {/* {chat.response && (
                <div className="flex justify-start">
                  <div
                    className="bg-white text-gray-800 rounded-2xl rounded-tl-none 
                    px-6 py-3 max-w-md shadow-md hover:shadow-lg transition-shadow
                    border border-gray-200 text-sm md:text-base"
                  >
                    {chat.response}
                  </div>
                </div>
              )} */}
              {chat.response && (
  <div className="flex justify-start">
    <div
      className="bg-white text-gray-800 rounded-2xl rounded-tl-none 
      px-6 py-3 max-w-md shadow-md hover:shadow-lg transition-shadow
      border border-gray-200 text-sm md:text-base whitespace-pre-line"
    >
      {chat.response}
    </div>
  </div>
)}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div
                className=" text-white rounded-2xl rounded-tl-none 
                px-6 py-3 max-w-md shadow-md hover:shadow-lg transition-shadow
                 animate-pulse  text-sm md:text-base italic"
              >
                generating response from the meeting documents...
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatDisplay;
