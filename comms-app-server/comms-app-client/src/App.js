import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import RealTimeMessages from "./realTimeMessages";
import ChatAppClient from "./chatAppClient";
import EmailAppClient from "./emailAppClient";
import VoiceApp from "./voiceApp";
import IncomingCall from "./incomingCall";

const serverUrl = "http://localhost:5000";
// const socket = io(serverUrl, {
//   transports: ["websocket", "polling"],
// });

const App = () => {
  // const [messages, setMessages] = useState([]);
  // const [input, setInput] = useState("");

  // useEffect(() => {
  //   socket.on("message", (message) => {
  //     setMessages([...messages, message]);
  //   });
  // }, [messages]);

  // const sendMessage = () => {
  //   socket.emit("message", input);
  //   setInput("");
  // };

  // //SEND EMAIL
  // const sendEmail = (e) => {
  //   e.preventDefault();
  //   const formData = new FormData(e.target);

  //   axios
  //     .post(`${serverUrl}/email`, formData)
  //     .then((response) => console.log("Email sent:", response))
  //     .catch((error) => console.log("Error sending email:", error));
  // };

  //SEND SMS
  const sendSMS = (e) => {
    e.preventDefault();
    axios
      .post(`${serverUrl}/send-sms`, {
        to: e.target.to.value,
        message: e.target.message.value,
      })
      .then((response) => console.log("SMS sent:", response))
      .catch((error) => console.log("Error sending SMS:", error));
  };

  return (
    <div>
      <h1>Communication App</h1>
      <hr />
      <VoiceApp />
      <hr />
      <IncomingCall />
      <hr />
      <ChatAppClient />
      <hr />
      <h2>Email</h2>
      <EmailAppClient />
      <hr/>
      <div>
        <h2>SMS</h2>
        <form onSubmit={sendSMS}>
          <input type="tel" name="to" placeholder="Recipient" required />
          <textarea name="message" placeholder="Message" required />
          <button type="submit">Send SMS</button>
        </form>
      </div>
      <hr />
      <RealTimeMessages />
    </div>
  );
};

export default App;
