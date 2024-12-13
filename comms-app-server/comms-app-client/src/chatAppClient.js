import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const serverUrl = "http://localhost:5000";
const socket = io(serverUrl, {
  transports: ["websocket", "polling"],
});

function ChatAppClient() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('active-users', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on('user-left', (username) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user !== username));
    });

    return () => {
      socket.off('chat message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('active-users');
    };
  }, []);

  const sendMessage = () => {
    if (message) {
      socket.emit('chat message', { text: message, type: 'text' });
      setMessage('');
    }
  };

  const sendFile = async () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await axios.post('http://localhost:5000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        socket.emit('chat message', { text: response.data.filePath, type: 'file' });
        setFile(null);
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  };

  const register = async () => {
    try {
      await axios.post('http://localhost:5000/register', { username, password });
      alert('Registration successful');
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  const login = async () => {
    try {
      const response = await axios.post('http://localhost:5000/login', { username, password });
      setCurrentUser(response.data.username);
      setLoggedIn(true);
      socket.emit('user-joined', response.data.username);
      alert('Login successful');
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/logout');
      socket.emit('user-left', currentUser);
      setLoggedIn(false);
      setCurrentUser('');
      alert('Logout successful');
    } catch (error) {
      alert('Logout failed');
    }
  };

  return (
    <div>
      <h1>Chat App</h1>
      {!loggedIn ? (
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button onClick={register}>Register</button>
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <div>
          <h3>Logged in as: {currentUser}</h3>
          <button onClick={logout}>Logout</button>
          <h4>Active Users:</h4>
          <ul>
            {users.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
          <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.sender}:</strong>{' '}
                {msg.type === 'text' ? (
                  <span>{msg.text}</span>
                ) : (
                  <a href={msg.text} target="_blank" rel="noopener noreferrer">Download File</a>
                )}
              </div>
            ))}
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
          />
          <button onClick={sendMessage}>Send</button>
          <br />
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={sendFile}>Send File</button>
        </div>
      )}
    </div>
  );
}

export default ChatAppClient;
