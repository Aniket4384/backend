const Submission = require("../models/submission");
const Problem = require("../models/problem");
const {
    getId,
    submitBatch,
    checkStatus
} = require("../utils/problemUtility");


const submitCode = async (req, res) => {

    const { problemId } = req.params;
    const { code, language } = req.body;

    try {

        if (!problemId || !code || !language) {
            return res.status(400).json({
                success: false,
                message: "Problem id, code and language are required"
            });
        }

        const problem = await Problem.findById(problemId);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        const languageId = getId(language);

        if (!languageId) {
            return res.status(400).json({
                success: false,
                message: `Invalid language: ${language}`
            });
        }

        const testCases = problem.hiddenTestCases;

        if (!testCases || testCases.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No hidden test cases found"
            });
        }

        const newSubmission = await Submission.create({
            userId: req.result._id,
            problemId: problemId,
            code: code,
            language: language,
            status: "pending",
            testCasesPassed: 0,
            testCasesTotal: testCases.length
        });

        const submissions = testCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);

        if (!submitResult || !Array.isArray(submitResult)) {
            throw new Error("Invalid response from Judge0");
        }

        const tokens = submitResult.map(
            (value) => value.token
        );

        if (
            tokens.length !== testCases.length ||
            tokens.some((token) => !token)
        ) {
            throw new Error("Invalid submission tokens received");
        }

        const testResults = await checkStatus(tokens);

        if (!testResults || testResults.length === 0) {
            throw new Error("No result received from Judge0");
        }

        let finalStatus = "Accepted";
        let errorMessage = "";
        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;

        for (const result of testResults) {

            if (result.status.id === 3) {

                testCasesPassed++;

            } else {

                switch (result.status.id) {

                    case 4:
                        finalStatus = "Wrong Answer";
                        break;

                    case 5:
                        finalStatus = "Time Limit Exceeded";
                        break;

                    case 6:
                        finalStatus = "Compilation Error";
                        break;

                    case 7:
                    case 8:
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                    case 14:
                        finalStatus = "Runtime Error";
                        break;

                    case 13:
                        finalStatus = "Internal Error";
                        break;

                    default:
                        finalStatus = "Error";
                }

                errorMessage =
                    result.stderr ||
                    result.compile_output ||
                    result.message ||
                    result.status.description ||
                    "";

                runtime = result.time
                    ? Number(result.time) * 1000
                    : 0;

                memory = result.memory || 0;

                break;
            }
        }

        if (finalStatus === "Accepted") {

            const lastResult =
                testResults[testResults.length - 1];

            runtime = lastResult.time
                ? Number(lastResult.time) * 1000
                : 0;

            memory = lastResult.memory || 0;
        }

        const updatedSubmission =
            await Submission.findByIdAndUpdate(
                newSubmission._id,
                {
                    status: finalStatus,
                    runtime: runtime,
                    memory: memory,
                    errorMessage: errorMessage,
                    testCasesPassed: testCasesPassed
                },
                {
                    new: true
                }
            );

        if (
            finalStatus === "Accepted" &&
            !req.result.problemSolved.some(
                (id) => id.toString() === problemId.toString()
            )
        ) {
            req.result.problemSolved.push(problemId);
            await req.result.save();
        }

        return res.status(200).json({
            success: true,
            message: finalStatus,
            submission: updatedSubmission
        });

    } catch (err) {

        console.error("Submit Code Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Code submission failed"
        });
    }
};


const runCode = async (req, res) => {

    const { problemId } = req.params;
    const { code, language } = req.body;

    try {

        if (!problemId || !code || !language) {
            return res.status(400).json({
                success: false,
                message: "Problem id, code and language are required"
            });
        }

        const problem = await Problem.findById(problemId);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        const languageId = getId(language);

        if (!languageId) {
            return res.status(400).json({
                success: false,
                message: `Invalid language: ${language}`
            });
        }

        const testCases = problem.visibleTestCases;

        if (!testCases || testCases.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No visible test cases found"
            });
        }

        const submissions = testCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);

        if (!submitResult || !Array.isArray(submitResult)) {
            throw new Error("Invalid response from Judge0");
        }

        const tokens = submitResult.map(
            (value) => value.token
        );

        if (
            tokens.length !== testCases.length ||
            tokens.some((token) => !token)
        ) {
            throw new Error("Invalid submission tokens received");
        }

        const testResults = await checkStatus(tokens);

        if (!testResults || testResults.length === 0) {
            throw new Error("No result received from Judge0");
        }

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let finalStatus = "Accepted";
        let errorMessage = "";

        for (const result of testResults) {

            if (result.status.id === 3) {

                testCasesPassed++;

            } else {

                switch (result.status.id) {

                    case 4:
                        finalStatus = "Wrong Answer";
                        break;

                    case 5:
                        finalStatus = "Time Limit Exceeded";
                        break;

                    case 6:
                        finalStatus = "Compilation Error";
                        break;

                    case 7:
                    case 8:
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                    case 14:
                        finalStatus = "Runtime Error";
                        break;

                    case 13:
                        finalStatus = "Internal Error";
                        break;

                    default:
                        finalStatus = "Error";
                }

                errorMessage =
                    result.stderr ||
                    result.compile_output ||
                    result.message ||
                    result.status.description ||
                    "";

                runtime = result.time
                    ? Number(result.time) * 1000
                    : 0;

                memory = result.memory || 0;

                break;
            }
        }

        if (finalStatus === "Accepted") {

            const lastResult =
                testResults[testResults.length - 1];

            runtime = lastResult.time
                ? Number(lastResult.time) * 1000
                : 0;

            memory = lastResult.memory || 0;
        }

        return res.status(200).json({
            success: true,
            status: finalStatus,
            testCasesPassed,
            testCasesTotal: testCases.length,
            runtime,
            memory,
            errorMessage,
            results: testResults.map((result, index) => ({
                testCase: index + 1,
                status: result.status.description,
                stdout: result.stdout || null,
                stderr: result.stderr || null,
                compile_output: result.compile_output || null,
                expected_output: result.expected_output || null,
                time: result.time || null,
                memory: result.memory || null
            }))
        });

    } catch (err) {

        console.error("Run Code Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Code execution failed"
        });
    }
}
module.exports = {submitCode,runCode};


