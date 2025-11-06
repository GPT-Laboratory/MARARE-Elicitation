import React, { useState } from "react";
// import { FaPaperPlane } from "react-icons/fa";
import axios from "axios"; // Assuming you'll use Axios to make backend requests
import { io } from "socket.io-client";


const protocol = window.location.protocol; // 'http:' or 'https:'
const host = window.location.hostname;     // Gets the domain name or IP
const port = 5000;
const socketURL = `${protocol}//${host}:${port}`;
// const socketURL = `${protocol}//${host}`;
const socket = io(socketURL);

const Querybar = ({ onSendMessage }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent form submission refresh
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex fixed -bottom-4 pb-10 bg-gray-800 items-center w-full md:w-[50%] justify-center p-4">
      <form onSubmit={handleSubmit} className="flex w-full max-w-xl">
        <div className="flex border w-full rounded-full border-gray-950 shadow-lg overflow-hidden">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 text-gray-700 bg-white focus:outline-none focus:ring focus:ring-blue-300 rounded-l-full"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={input === ''}
            className={`flex items-center justify-center px-4 rounded-r-full ${
              input === ''
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Querybar;
