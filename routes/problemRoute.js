
const express = require("express")
const problemRouter = express.Router()
const userMiddleware = require("../middleware/userMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const {createProblem,updateProblem, deleteProblem,getProblemById,getAllProblems,solvedProblems, submittedProblem} = require("../controllers/problemCreator")

problemRouter.post("/create",adminMiddleware,createProblem)
problemRouter.put("/update/:id",adminMiddleware,updateProblem)
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem)

problemRouter.get("/problemById/:id" ,userMiddleware, getProblemById)  // fetch particular problem
problemRouter.get("/getAllProblem",userMiddleware,getAllProblems)  // fetch all problems
problemRouter.get("/problemSolvedByUser",userMiddleware, solvedProblems)  // fetch solved problems

problemRouter.get("/submittedProblem/:problemId",userMiddleware,submittedProblem)


module.exports = problemRouter