const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const SolutionVideo = require("../models/video");
const {getId,submitBatch, submitToken, checkStatus} = require("../utils/problemUtility");


const createProblem = async (req, res) => {
    const {
        title,
        description,
        difficulty,
        tags,
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution
    } = req.body;

    try {

        if (!title || !description || !difficulty || !tags) {
            throw new Error("Required problem fields are missing");
        }

        if (!visibleTestCases || visibleTestCases.length === 0) {
            throw new Error("At least one visible test case is required");
        }

        if (!referenceSolution || referenceSolution.length === 0) {
            throw new Error("Reference solution is required");
        }

        for (const { language, completeCode } of referenceSolution) {

            const languageId = getId(language);

            const submissions = visibleTestCases.map((testcase) => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            const submitResult = await submitBatch(submissions);

            const resultToken = submitResult.map(
                (value) => value.token
            );

            const testResult = await checkStatus(resultToken);

            const failedTest = testResult.find(
                (result) => result.status.id !== 3
            );

            if (failedTest) {

                const statusId = failedTest.status.id;

                let errorMessage;

                switch (statusId) {

                    case 4:
                        errorMessage = "Wrong Answer";
                        break;

                    case 5:
                        errorMessage = "Time Limit Exceeded";
                        break;

                    case 6:
                        errorMessage = "Compilation Error";
                        break;

                    case 7:
                        errorMessage = "Runtime Error: SIGSEGV";
                        break;

                    case 8:
                        errorMessage = "Runtime Error: SIGXFSZ";
                        break;

                    case 9:
                        errorMessage = "Runtime Error: SIGFPE";
                        break;

                    case 10:
                        errorMessage = "Runtime Error: SIGABRT";
                        break;

                    case 11:
                        errorMessage = "Runtime Error: NZEC";
                        break;

                    case 12:
                        errorMessage = "Runtime Error";
                        break;

                    case 13:
                        errorMessage = "Judge Internal Error";
                        break;

                    case 14:
                        errorMessage = "Executable Format Error";
                        break;

                    default:
                        errorMessage = failedTest.status.description;
                }

                return res.status(400).json({
                    success: false,
                    message: `${language} reference solution failed`,
                    error: errorMessage,
                    statusId: statusId,
                    status: failedTest.status.description,
                    stdout: failedTest.stdout,
                    stderr: failedTest.stderr,
                    compile_output: failedTest.compile_output,
                    time: failedTest.time,
                    memory: failedTest.memory
                });
            }
        }

        const userProblem = await Problem.create({
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases,
            startCode,
            referenceSolution,
            problemCreator: req.result._id
        });

        return res.status(201).json({
            success: true,
            message: "Problem created successfully",
            problem: userProblem
        });

    } catch (err) {

        console.error("Create Problem Error:", err);

        return res.status(400).json({
            success: false,
            message: err.message || "Failed to create problem"
        });
    }
};

const updateProblem = async (req, res) => {
    const { id } = req.params;

    const {
        title,
        description,
        difficulty,
        tags,
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution
    } = req.body;

    try {

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Problem id is required"
            });
        }

        const problem = await Problem.findById(id);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        const finalVisibleTestCases =
            visibleTestCases ?? problem.visibleTestCases;

        const finalReferenceSolution =
            referenceSolution ?? problem.referenceSolution;

        if (
            finalReferenceSolution &&
            finalReferenceSolution.length > 0 &&
            finalVisibleTestCases &&
            finalVisibleTestCases.length > 0
        ) {

            for (const { language, completeCode } of finalReferenceSolution) {

                const languageId = getId(language);

                if (!languageId) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid language: ${language}`
                    });
                }

                const submissions = finalVisibleTestCases.map((testcase) => ({
                    source_code: completeCode,
                    language_id: languageId,
                    stdin: testcase.input,
                    expected_output: testcase.output
                }));

                const submitResult = await submitBatch(submissions);

                if (
                    !submitResult ||
                    !Array.isArray(submitResult) ||
                    submitResult.length === 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Failed to submit ${language} reference solution`
                    });
                }

                const tokens = submitResult.map(
                    (value) => value.token
                );

                if (tokens.some((token) => !token)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid submission token for ${language}`
                    });
                }

                const testResult = await checkStatus(tokens);

                const failedTest = testResult.find(
                    (result) => result.status.id !== 3
                );

                if (failedTest) {

                    const statusId = failedTest.status.id;

                    let errorMessage;

                    switch (statusId) {

                        case 4:
                            errorMessage = "Wrong Answer";
                            break;

                        case 5:
                            errorMessage = "Time Limit Exceeded";
                            break;

                        case 6:
                            errorMessage = "Compilation Error";
                            break;

                        case 7:
                            errorMessage = "Runtime Error: SIGSEGV";
                            break;

                        case 8:
                            errorMessage = "Runtime Error: SIGXFSZ";
                            break;

                        case 9:
                            errorMessage = "Runtime Error: SIGFPE";
                            break;

                        case 10:
                            errorMessage = "Runtime Error: SIGABRT";
                            break;

                        case 11:
                            errorMessage = "Runtime Error: NZEC";
                            break;

                        case 12:
                            errorMessage = "Runtime Error";
                            break;

                        case 13:
                            errorMessage = "Internal Error";
                            break;

                        case 14:
                            errorMessage = "Exec Format Error";
                            break;

                        default:
                            errorMessage =
                                failedTest.status.description ||
                                "Submission failed";
                    }

                    return res.status(400).json({
                        success: false,
                        message: `${language} reference solution failed`,
                        error: errorMessage,
                        statusId: statusId,
                        status: failedTest.status.description,
                        stdout: failedTest.stdout,
                        stderr: failedTest.stderr,
                        compile_output: failedTest.compile_output,
                        time: failedTest.time,
                        memory: failedTest.memory
                    });
                }
            }
        }

        const updateData = {};

        if (title !== undefined) {
            updateData.title = title;
        }

        if (description !== undefined) {
            updateData.description = description;
        }

        if (difficulty !== undefined) {
            updateData.difficulty = difficulty;
        }

        if (tags !== undefined) {
            updateData.tags = tags;
        }

        if (visibleTestCases !== undefined) {
            updateData.visibleTestCases = visibleTestCases;
        }

        if (hiddenTestCases !== undefined) {
            updateData.hiddenTestCases = hiddenTestCases;
        }

        if (startCode !== undefined) {
            updateData.startCode = startCode;
        }

        if (referenceSolution !== undefined) {
            updateData.referenceSolution = referenceSolution;
        }

        const updatedProblem = await Problem.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true  
            }
        );

        return res.status(200).json({
            success: true,
            message: "Problem updated successfully",
            problem: updatedProblem
        });

    } catch (err) {

        console.error("Update Problem Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
};

const deleteProblem = async (req, res) => {
    const { id } = req.params;

    try {

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Problem id is required"
            });
        }

        const deletedProblem = await Problem.findByIdAndDelete(id);

        if (!deletedProblem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Problem deleted successfully"
        });

    } catch (err) {

        console.error("Delete Problem Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



const getProblemById = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Problem id is required"
            });
        }

        const problem = await Problem.findById(id);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        return res.status(200).json({
            success: true,
            problem
        });

    } catch (err) {
        console.error("Get Problem Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};




const getAllProblems = async (req, res) => {
    try {

        const problems = await Problem.find();  // array

        return res.status(200).json({
            success: true,
            count: problems.length,
            problems
        });

    } catch (err) {

        console.error("Get All Problems Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const solvedProblems = async(req,res)=>{
    try {

        const user = await User.findById(req.result._id)
            .populate("problemSolved");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            count: user.problemSolved.length,
            problems: user.problemSolved  // problems will be array and contain all info due to populate
        });

    } catch (err) {

        console.error("Solved Problems Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }

}

const submittedProblem = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.problemId;

    
        const ans = await Submission.find({
            userId: userId,
            problemId: problemId
        });

          

        if (ans.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No submission is present",
                submissions: []
            });
        }

        return res.status(200).json({
            success: true,
            submissions: ans
        });

    } catch (err) {

        console.error("Submitted Problem Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblems,solvedProblems,submittedProblem}