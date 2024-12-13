import React, { useState, useEffect } from 'react';
// import axios from 'axios';

function Inbox() {
    const [emails, setEmails] = useState([]);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onmessage = (event) => {
            const email = JSON.parse(event.data);
            setEmails((prevEmails) => [...prevEmails, email]);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => ws.close();
    }, []);

    return (
        <div>
            <h1>Inbox</h1>
            {emails.map((email) => (
                <div key={email.id}>
                    <h2>{email.subject}</h2>
                    <p><strong>From:</strong> {email.sender}</p>
                    <p><strong>Body:</strong> {email.body}</p>
                    <h3>Attachments:</h3>
                    <ul>
                        {email.attachments.map((att) => (
                            <li key={att.name}>
                                <a href={`http://localhost:5000/attachments/${att.name}`} download>
                                    {att.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default Inbox;
