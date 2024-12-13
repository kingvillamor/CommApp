// ComposeEmail.js
import React, { useState } from 'react';
import axios from 'axios';

function ComposeEmail() {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState([]);

    const handleFileChange = (e) => {
        setAttachments(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('to', to);
        formData.append('subject', subject);
        formData.append('body', body);
        Array.from(attachments).forEach(file => {
            formData.append('attachments', file);
        });

        try {
            const response = await axios.post('http://localhost:5000/send', formData);
            alert(response.data.message);
        } catch (error) {
            alert('Error sending email: ' + error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>To:</label>
                <input type="email" value={to} onChange={(e) => setTo(e.target.value)} required />
            </div>
            <div>
                <label>Subject:</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
                <label>Body:</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} required></textarea>
            </div>
            <div>
                <label>Attachments:</label>
                <input type="file" multiple onChange={handleFileChange} />
            </div>
            <button type="submit">Send</button>
        </form>
    );
}

export default ComposeEmail;