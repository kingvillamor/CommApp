import React, { useState } from 'react';
import axios from 'axios';

const VoiceApp = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [status, setStatus] = useState('');

    const handleCall = async () => {
        try {
            setStatus('Calling...');
            const response = await axios.post('http://localhost:5000/call', {
                to: phoneNumber,
            });
            setStatus(`Call initiated: ${response.data.callSid}`);
        } catch (error) {
            setStatus(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>Voice Call</h1>
            <input
                type="text"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ padding: '10px', width: '300px', marginBottom: '10px' }}
            />
            <br />
            <button onClick={handleCall} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                Call
            </button>
            <p>{status}</p>
        </div>
    );
};

export default VoiceApp;