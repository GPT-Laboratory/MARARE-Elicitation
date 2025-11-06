import { useContext } from "react";
// import { Context } from '../ContextAzure';

const MeetingTranscript = ({ localTranscript, remoteTranscript }) => {
  return (
    <div className="fixed left-4 bottom-24 w-80 bg-white rounded-lg shadow-lg p-4 max-h-[60vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Live Transcript</h3>

      <div className="space-y-4">
        {/* Local Transcript */}
        <div className="space-y-2">
          <h4 className="font-medium text-blue-600">You:</h4>
          {localTranscript.map((text, index) => (
            <p
              key={`local-${index}`}
              className="text-sm text-gray-700 bg-blue-50 p-2 rounded"
            >
              {text}
            </p>
          ))}
        </div>

        {/* Remote Transcripts */}
        {Object.entries(remoteTranscript).map(([userId, texts]) => (
          <div key={userId} className="space-y-2">
            <h4 className="font-medium text-green-600">
              Peer ${userId.slice(0, 4)}
            </h4>
            {texts.map((text, index) => (
              <p
                key={`remote-${userId}-${index}`}
                className="text-sm text-gray-700 bg-green-50 p-2 rounded"
              >
                {text}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingTranscript;
