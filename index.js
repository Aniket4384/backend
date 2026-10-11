const express = require('express')
const app = express()

const dotenv = require("dotenv")
dotenv.config()

const db = require("./config/db")
const redisClient = require("./config/redis")
const cors = require("cors")
const main = require("./config/db");
const cookieParser = require("cookie-parser");
const authRouter = require('./routes/userAuthentication')
const problemRouter = require('./routes/problemRoute')
const submitRouter = require('./routes/submitRoute')
const aiRouter = require('./routes/aiChatting')
const videoRouter = require('./routes/videoRouter')


app.use(cors({
  origin: ["http://localhost:5173","https://leetcode-final.vercel.app/"],
  credentials :true
}))

app.use(express.json());
app.use(cookieParser());

app.use("/user", authRouter )
app.use("/problem" ,problemRouter)
app.use("/submission", submitRouter)
app.use("/ai",aiRouter)
app.use("/video", videoRouter);

const startServer = async () => {
    await db();
    await redisClient.connect();

    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
};

startServer();
