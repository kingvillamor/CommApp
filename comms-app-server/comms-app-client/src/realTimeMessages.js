// RealTimeMessages.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const serverUrl = "http://localhost:5000";
const socket = io(serverUrl, {
  transports: ["websocket", "polling"],
});

const RealTimeMessages = () => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Listen for new messages from the server
        socket.on('new-message', (message) => {
            setMessages((prevMessages) => [message, ...prevMessages]);
        });

        return () => {
            socket.off('new-message');
        };
    }, []);

    return (
        <div>
            <h2>Real-Time Received Messages</h2>
            {messages.length === 0 ? (
                <p>No messages received yet.</p>
            ) : (
                <ul>
                    {messages.map((message, index) => (
                        <li key={index} style={{ marginBottom: '10px' }}>
                            <strong>From:</strong> {message.from} <br />
                            <strong>To:</strong> {message.to} <br />
                            <strong>Message:</strong> {message.body} <br />
                            <strong>Received At:</strong> {new Date(message.receivedAt).toLocaleString()}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RealTimeMessages;
