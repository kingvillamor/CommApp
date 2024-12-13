import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ComposeEmail from './composeEmail';
import Inbox from './inbox';

function EmailAppLayout() {
    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Left Section: ComposeEmail */}
            <div style={{ flex: 1, borderRight: '1px solid #ccc', padding: '20px' }}>
                <ComposeEmail />
            </div>

            {/* Right Section: Inbox */}
            <div style={{ flex: 2, padding: '20px' }}>
                <Inbox />
            </div>
        </div>
    );
}

function EmailAppClient() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<EmailAppLayout />} />
            </Routes>
        </Router>
    );
}

export default EmailAppClient;
