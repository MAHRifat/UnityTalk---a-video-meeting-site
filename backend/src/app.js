require('dotenv').config();
const express = require('express')
const { createServer } = require("node:http")

const { Server } = require("socket.io")
const mongoose = require("mongoose")

const cors = require("cors")

const { connectToSocket } = require('./controllers/socketManager')
const { userRoute } = require("./routes/users.routes")
const meetingRouter = require('./routes/meetings.routes');



const app = express()
const server = createServer(app)
const io = connectToSocket(server)


app.set("port", (process.env.PORT || 3000))
const allowedOrigins = [
    'http://localhost:5173',
    'https://unitytalk-60xq.onrender.com',
    'https://unitytalk-3ubl.onrender.com/',
    'https://unitytalk-a-video-meeting-site.onrender.com/'
    // Add other environments as needed
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Authorization']
  }));
app.use(express.json({ limit: "40kb" }))
app.use(express.urlencoded({ limit: "40kb", extended: true }))

app.use("/api/v1/users", userRoute);
app.use("/api/meetings", meetingRouter);

app.get('/', (req, res) => res.send('Hello World!'))

const start = async () => {
    app.set("mongo_user")
    const connectionDB = await mongoose.connect(process.env.MONGODB_URI)
    console.log("MONGO connected DB Host: " + connectionDB.connection.host)
    server.listen(app.get("port"), () => {
        console.log("LISTENING ON PORT 3000")
    })
}

start()