const express = require("express")
const userMiddleware = require("../middleware/userMiddleware")
const {submitCode,runCode} = require("../controllers/submission")
const {submitRateLimiter,runRateLimiter} = require("../middleware/rateLimiter")
const submitRouter = express()



submitRouter.post("/submit/:problemId",userMiddleware,submitRateLimiter, submitCode)

submitRouter.post("/run/:problemId",userMiddleware,runRateLimiter,runCode)

module.exports = submitRouter