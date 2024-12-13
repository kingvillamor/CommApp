const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const multer = require("multer");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const ngrok = require("ngrok");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const Imap = require("imap");
const WebSocket = require("ws");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const PORT = 5000;
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
require("dotenv").config();
app.use(express.json());
app.use(cors());
app.use(express.static("uploads"));
const bodyParser = require("body-parser");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;
const TWILIO_APP_SID = process.env.TWILIO_APP_SID;
const twilioClient = new twilio(accountSid, authToken);
const phoneNumberSid = process.env.TWILIO_PSID;
const twilioPhoneNumber = "+17754769800";
var ngrokCallUrl;

// Endpoint to initiate an outbound call
app.post("/call", (req, res) => {
  const { to } = req.body;

  twilioClient.calls
    .create({
      url: ngrokCallUrl,
      to,
      from: twilioPhoneNumber,
    })
    .then((call) => res.send({ message: "Call initiated", callSid: call.sid }))
    .catch((error) => res.status(500).send({ error: error.message }));
});

// (INCOMING CALL) Endpoint to generate Twilio Access Token
app.get('/token', (req, res) => {
  try {
      // Replace 'user' with dynamic identity if needed
      const identity = req.query.identity || 'default_user';

      // Create a Voice Grant
      const voiceGrant = new VoiceGrant({
          outgoingApplicationSid: TWILIO_APP_SID,
          incomingAllow: true,
      });

      // Create an Access Token
      const token = new AccessToken(accountSid, TWILIO_API_KEY, TWILIO_API_SECRET, { identity });
      token.addGrant(voiceGrant);

      res.json({ token: token.toJwt() });
  } catch (error) {
      console.error('Error generating token:', error);
      res.status(500).send('Failed to generate token.');
  }
});

// (INCOMING CALL) Middleware
// app.use(bodyParser.urlencoded({ extended: false }));

// Endpoint for handling Twilio Webhook
app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say("You have reached our live application. Connecting you now...");
  twiml.dial().client("user"); // Redirect to the user in the React app

  res.type("text/xml");
  res.send(twiml.toString());
});

//LIVE CHAT APPLICATION SERVER SIDE
// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({ storage });

// Routes for file uploads
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ filePath: `http://localhost:5000/${req.file.filename}` });
});

// In-memory user store
const activeUsers = new Set(); // Global list of active users

// Routes for authentication
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (activeUsers[username]) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  activeUsers[username] = { password: hashedPassword };
  res.status(200).json({ message: "User registered successfully" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = activeUsers[username];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  req.session.user = username;
  res.status(200).json({ username });
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.status(200).json({ message: "Logout successful" });
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("user-joined", (username) => {
    socket.username = username;
    activeUsers.add(username);
    io.emit("active-users", Array.from(activeUsers)); // Send updated list to all clients
  });

  socket.on("chat message", (message) => {
    io.emit("chat message", {
      text: message.text,
      type: message.type,
      sender: socket.username,
    });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      activeUsers.delete(socket.username);
      io.emit("active-users", Array.from(activeUsers)); // Send updated list to all clients
      io.emit("user-left", socket.username);
    }
    console.log("User disconnected:", socket.id);
  });
});

// Endpoint to send email with attachments
app.post("/send", upload.array("attachments"), async (req, res) => {
  const { to, subject, body } = req.body;

  const attachments = req.files.map((file) => ({
    filename: file.originalname,
    path: file.path,
  }));

  // Configure Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail", // Use appropriate service
    auth: {
      user: process.env.MY_EMAIL, // Replace with your email
      pass: process.env.EMAIL_APP_PASS, // Replace with your email password
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to,
    subject,
    text: body,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    // Clean up uploaded files
    attachments.forEach((file) => fs.unlinkSync(file.path));
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//TO DOWNLOAD ATTACHMENTS
const saveAttachment = (attachment) => {
  const attachmentsDir = path.join(__dirname, "attachments");
  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir); // Create directory if it doesn't exist
  }

  const filePath = path.join(attachmentsDir, attachment.filename);
  fs.writeFileSync(filePath, attachment.content);
  return filePath;
};

// Endpoint to fetch received emails
app.get("/emails", async (req, res) => {
  const imapConfig = {
    user: process.env.MY_EMAIL, // Your email
    password: process.env.EMAIL_APP_PASS, // Your email password or app-specific password
    host: "imap.gmail.com", // IMAP server host
    port: 993, // IMAP port
    tls: true, // Use TLS for security
    tlsOptions: { rejectUnauthorized: false }, // Ignore self-signed certificates
  };

  const startRealTimeEmailFetching = (onNewEmail) => {
    const imap = new Imap(imapConfig);

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          console.error("Error opening inbox:", err.message);
          return;
        }

        console.log("Listening for new emails...");

        imap.on("mail", () => {
          imap.search(["UNSEEN"], (err, results) => {
            if (err || !results || results.length === 0) {
              return; // No new emails
            }

            const fetch = imap.fetch(results, { bodies: "" });

            fetch.on("message", (msg) => {
              msg.on("body", async (stream) => {
                const parsed = await simpleParser(stream);
                const email = {
                  id: parsed.messageId,
                  subject: parsed.subject,
                  sender: parsed.from.text,
                  body: parsed.text,
                  attachments: parsed.attachments.map((att) => ({
                    id: att.cid,
                    name: att.filename,
                  })),
                };

                // Callback to handle new email
                onNewEmail(email);
              });
            });

            fetch.once("end", () => {
              console.log("New email processed.");
            });
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.error("IMAP Error:", err.message);
    });

    imap.once("end", () => {
      console.log("Connection ended.");
    });

    imap.connect();
  };

  // Start real-time email fetching and log new emails
  startRealTimeEmailFetching((email) => {
    console.log("New Email:", email);
  });
});
// IMAP Configuration
const imapConfig = {
  user: process.env.MY_EMAIL,
  password: process.env.EMAIL_APP_PASS,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

// Function to start real-time email fetching
const startRealTimeEmailFetching = (onNewEmail) => {
  const imap = new Imap(imapConfig);

  imap.once("ready", () => {
    imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        console.error("Error opening inbox:", err.message);
        return;
      }

      console.log("Listening for new emails...");

      imap.on("mail", () => {
        imap.search(["UNSEEN"], (err, results) => {
          if (err || !results || results.length === 0) {
            return; // No new emails
          }

          const fetch = imap.fetch(results, { bodies: "", struct: true });

          fetch.on("message", (msg) => {
            msg.on("body", async (stream) => {
              const parsed = await simpleParser(stream);
              const attachments = parsed.attachments.map((att) => {
                const filePath = saveAttachment(att); // Save attachment
                return {
                  name: att.filename,
                  path: filePath,
                };
              });

              const email = {
                id: parsed.messageId,
                subject: parsed.subject,
                sender: parsed.from.text,
                body: parsed.text,
                attachments,
              };

              onNewEmail(email);
            });
          });

          fetch.once("end", () => {
            console.log("New email processed.");
          });
        });
      });
    });
  });

  imap.once("error", (err) => {
    console.error("IMAP Error:", err.message);
  });

  imap.once("end", () => {
    console.log("Connection ended.");
  });

  imap.connect();
};

//SAVE ATTACHMENTS
app.get("/attachments/:filename", (req, res) => {
  const filePath = path.join(__dirname, "attachments", req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath); // Send the file for download
  } else {
    res.status(404).send("File not found");
  }
});

// WebSocket Server for Real-Time Notifications
const wss = new WebSocket.Server({ port: 8080 });
wss.on("connection", (ws) => {
  console.log("(Email)Client connected to WebSocket");

  // Start listening for new emails and send them to the client
  startRealTimeEmailFetching((email) => {
    ws.send(JSON.stringify(email)); // Send new email to the client
  });

  ws.on("close", () => {
    console.log("(Email)Client disconnected");
  });
});

// // Endpoint to download attachment
// app.get("/download/:id", (req, res) => {
//   const filePath = path.join(__dirname, "uploads", req.params.id); // Replace with real file path
//   res.download(filePath);
// });

//SEND SMS
app.post("/send-sms", (req, res) => {
  twilioClient.messages
    .create({
      body: req.body.message,
      to: req.body.to, // Text this number
      from: twilioPhoneNumber, // From a valid Twilio number
    })
    .then((message) => res.status(200).send("SMS sent: " + message.body))
    .catch((error) => console.log(error));
});

//RECEIVE SMS
// Endpoint to receive SMS (Twilio webhook)
app.post("/receive-sms", (req, res) => {
  const { From, Body, To } = req.body;

  const message = {
    from: From,
    body: Body,
    to: To,
    receivedAt: new Date(),
  };

  console.log(`Message received: ${JSON.stringify(message)}`);

  // Broadcast the message to all connected clients
  io.emit("new-message", message);

  res.status(200).send("Message received");
});

// Start ngrok and Update Twilio Webhook FOR SMS
async function startNgrokAndUpdateWebhook() {
  try {
    // Start ngrok
    const url = await ngrok.connect(5000); // Expose port 5000
    console.log(`(SMS)ngrok tunnel opened at: ${url}`);

    // Update Twilio webhook
    await twilioClient.incomingPhoneNumbers(phoneNumberSid).update({
      smsUrl: `${url}/receive-sms`,
    });

    console.log(`(SMS)Twilio webhook updated to: ${url}/receive-sms`);
  } catch (error) {
    console.error(
      "(SMS)Error while starting ngrok or updating webhook:",
      error
    );
  }
}

// Start ngrok and Update Twilio Webhook FOR VOICE
async function startNgrokAndUpdateWebhookVoice() {
  try {
    // Start ngrok
    const url = await ngrok.connect(5000); // Expose port
    console.log(`(Voice)ngrok tunnel opened at: ${url}`);

    // Update Twilio webhook
    await twilioClient.incomingPhoneNumbers(phoneNumberSid).update({
      voiceUrl: `${url}/incoming-call`,
    });

    ngrokCallUrl = `${url}/incoming-call`;
    console.log(`(VOICE)Twilio webhook updated to: ${url}/incoming-call`);
  } catch (error) {
    console.error(
      "(VOICE)Error while starting ngrok or updating webhook:",
      error
    );
  }
}

//START THE SERVER
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Call the asynchronous function to start ngrok and update Twilio webhook
  startNgrokAndUpdateWebhook();
  startNgrokAndUpdateWebhookVoice();
});
