import React, { useState } from 'react';
import axios from 'axios';
import { Device } from '@twilio/voice-sdk';

function IncomingCall() {
    const [device, setDevice] = useState(null);
    const [callStatus, setCallStatus] = useState('');
    const [incomingCall, setIncomingCall] = useState(null);

    const initializeDevice = async () => {
        try {
            const response = await axios.get('http://localhost:5000/token');
            const token = response.data.token;

            const twilioDevice = new Device(token);
            twilioDevice.on('ready', () => setCallStatus('Device ready to receive calls.'));
            twilioDevice.on('error', (err) => setCallStatus(`Error: ${err.message}`));
            twilioDevice.on('incoming', (call) => {
                setIncomingCall(call);
                setCallStatus('Incoming call...');
            });

            setDevice(twilioDevice);
        } catch (error) {
            console.error('Failed to initialize device:', error);
            setCallStatus('Failed to initialize device.');
        }
    };

    const acceptCall = () => {
        if (incomingCall) {
            incomingCall.accept();
            setCallStatus('Call connected.');
            setIncomingCall(null);
        }
    };

    const rejectCall = () => {
        if (incomingCall) {
            incomingCall.reject();
            setCallStatus('Call rejected.');
            setIncomingCall(null);
        }
    };

    const hangUp = () => {
        if (device) {
            device.disconnectAll();
            setCallStatus('Call ended.');
        }
    };

    return (
        <div>
            <h1>Live Communication</h1>
            <p>Status: {callStatus}</p>

            {!device && (
                <button onClick={initializeDevice}>Start Device</button>
            )}

            {incomingCall && (
                <div>
                    <p>Incoming call...</p>
                    <button onClick={acceptCall}>Accept</button>
                    <button onClick={rejectCall}>Reject</button>
                </div>
            )}

            <button onClick={hangUp} disabled={!device}>
                Hang Up
            </button>
        </div>
    );
}
export default IncomingCall;
