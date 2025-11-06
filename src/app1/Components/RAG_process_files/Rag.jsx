import React, { useState } from "react";
import ChatDisplay from "./ChatDisplay";
import Querybar from "./Querybar";
import axios from "axios"; // Assuming you'll use Axios to make backend requests


const protocol = window.location.protocol; // 'http:' or 'https:'
const host = window.location.hostname;     // Gets the domain name or IP
const port = 5000;
// const socketURL = `${protocol}//${host}:${port}`;
const socketURL = `${protocol}//${host}`;

// const socket = io(socketURL);

const Rag = () => {
  const [chatHistory, setChatHistory] = useState([]);

  // Function to handle sending a query and receiving a response
  const handleSendMessage = async (query) => {
    console.log(query);
    
    if (!query.trim()) return; // Prevent sending empty queries

    // Add the user's query to the chat history
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { query, response: null }, // Add placeholder for bot response
    ]);

    try {
      // Send query to the backend and get the response
      const response = await axios.post(`${socketURL}/send-message`, { message: query, chatHistory: chatHistory });
      console.log(response);

      // Add the response from the backend to the chat history
      setChatHistory((prevHistory) => {
        const updatedHistory = [...prevHistory];
        updatedHistory[updatedHistory.length - 1].response = response.data.response; // Assume response data has a `reply` field
        return updatedHistory;
      });
    } catch (error) {
      console.error("Error sending message to the backend:", error);
    }
  };

  // Render the chat display and query bar

  return (
    <div className="h-screen w-full bg-gray-800 overflow-y-scroll  flex flex-col items-center justify-center">
      <ChatDisplay chatHistory={chatHistory} />
      <Querybar onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Rag;
