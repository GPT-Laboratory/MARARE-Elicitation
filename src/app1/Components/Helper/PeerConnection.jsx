// export const configuration = {
//       iceServers: [
//         //Public STUN servers
//         { urls: "stun:stun.l.google.com:19302" },
//         { urls: "stun:stun1.l.google.com:19302" },
//         { urls: "stun:stun2.l.google.com:19302" },

//         // Add multiple TURN servers with the same credentials
//         {
//           urls: "turn:relay1.expressturn.com:80",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay1.expressturn.com:443",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay1.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay2.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay3.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay4.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay5.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay6.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay7.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay8.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay9.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay10.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//         {
//           urls: "turn:relay11.expressturn.com:3478",
//           username: "efY9L2VWMZS695G7SP",
//           credential: "DkuTJivvo4hUtWxB",
//         },
//       ],
//       iceCandidatePoolSize: 10,
//     };





// new servers and credentials

export const configuration = {
  iceServers: [
    // Public STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },

    // TURN servers with new credentials
    {
      urls: "turn:relay1.expressturn.com:80",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay1.expressturn.com:443",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay1.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay2.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay3.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay4.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay5.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay6.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay7.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay8.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay9.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay10.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay11.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay12.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay13.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay14.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay15.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay16.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:relay17.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
    {
      urls: "turn:global.expressturn.com:3478",
      username: "000000002073796855",
      credential: "7vaFx4szrdKlbQDuOvZlL++935w=",
    },
  ],
  iceCandidatePoolSize: 10,
};


// export const getConfig = async (socketURL) => {
//   const res = await fetch(`${socketURL}/webrtc/config`);
//   console.log("Fetched TURN/STUN configuration:", res);
  
//   return await res.json();
// };