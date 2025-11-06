import React, { useEffect, useRef } from "react";
import { CloseOutlined, SendOutlined } from "@ant-design/icons";

const RoomChat = ({
  messages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  onClose,
}) => {
  // Reference for the messages container
  const messagesEndRef = useRef(null);

  console.log("RoomChat messages:", messages);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && currentMessage.trim() !== "") {
      handleSendMessage();
    }
  };
  return (
    <div className="w-[15vw] h-[85vh] bg-white text-black rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden relative top-4 right-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-white">
        <h2 className="text-md font-semibold">In Call messages</h2>
        <CloseOutlined
          onClick={onClose}
          className="text-gray-500 hover:text-red-500 cursor-pointer"
        />
      </div>

      {/* Messages */}
      <div
        className={`px-4 py-2 flex-grow ${
          messages.length >= 7 ? "overflow-y-scroll" : ""
        }`}
      >
        {messages.map((msg, index) => {
          if (!msg.text || msg.text.trim() === "") return null;

          return (
            <div key={index} className="mb-4">
              <p className="text-sm font-medium text-gray-800">
                {msg.sender}{" "}
                <span className="text-xs text-gray-500 ml-2">{msg.time}</span>
              </p>
              <p className="text-sm text-gray-700">{msg.text}</p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="flex items-center px-4 py-3 border-t border-gray-300 bg-white">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Send a message"
          className="flex-grow px-4 py-2 text-sm bg-gray-100 text-black border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSendMessage}
          className="ml-3 text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-full shadow-md"
        >
          <SendOutlined />
        </button>
      </div>
    </div>
  );

  // return (
  //   <div className=" w-full h-full bg-gray-800 flex flex-col justify-between text-white border border-gray-600 rounded-lg shadow-lg ">
  //     <div className=" h-[20%]">
  //       {/* Top Bar with Toggle */}
  //       <div className="flex items-center justify-between   bg-gray-700 p-4">
  //         <span className="text-sm">Let everyone send messages</span>
  //         <label className="relative inline-flex items-center cursor-pointer">
  //           <input type="checkbox" className="sr-only peer" />
  //           <div className="w-11 h-6 bg-gray-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
  //         </label>
  //       </div>
  //       <div className="   px-3">
  //         <p className="text-sm text-gray-400 px-2 py-3">
  //           {/* You can pin a message to make it visible for people who join later. */}
  //           When you leave the call, you won't be able to access this chat.
  //         </p>
  //       </div>
  //     </div>

  //     {/* Messages Container */}
  //     <div
  //       className={`messages h-[70%] px-4  ${
  //         messages.length >= 7 && "overflow-y-scroll"
  //       }    `}
  //     >
  //       {messages.map((msg, index) => {
  //         if (
  //           !msg.text ||
  //           // typeof msg.text !== "string" ||
  //           msg.text.trim() === ""
  //         )
  //           return null;

  //         return (
  //           <div
  //             key={index}
  //             className={`flex mb-2 ${
  //               msg.sender === "You" ? "justify-end" : "justify-start"
  //             }`}
  //           >
  //             <div
  //               className={`rounded-lg px-3 py-2 max-w-xs text-sm shadow-md ${
  //                 msg.sender === "You"
  //                   ? "bg-blue-600 text-white"
  //                   : "bg-gray-700 text-gray-300"
  //               }`}
  //             >
  //               <strong className="block mb-1 text-xs">
  //                 {msg.sender === "You" ? "You" : msg.sender}
  //               </strong>
  //               <p className="break-words whitespace-pre-wrap">{msg.text}</p>
  //             </div>
  //           </div>
  //         );
  //       })}

  //       <div ref={messagesEndRef} />
  //     </div>

  //     {/* Chat Input */}
  //     <div className="chat-input h-[10%]  flex items-center p-3 border-t border-gray-600 bg-gray-700">
  //       <input
  //         type="text"
  //         placeholder="Send a message to everyone"
  //         value={currentMessage}
  //         onChange={(e) => setCurrentMessage(e.target.value)}
  //         onKeyPress={handleKeyPress} // Listen for Enter key
  //         className="flex-grow px-4 py-2 text-sm bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //       />
  //       <button
  //         onClick={handleSendMessage}
  //         className="ml-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-transform transform hover:scale-105 text-sm"
  //       >
  //         Send
  //       </button>
  //     </div>
  //   </div>
  // );
};

export default RoomChat;
