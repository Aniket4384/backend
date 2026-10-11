const { Base64 } = require("js-base64");
const axios = require("axios")
const getId = (lang)=>{

    const language = {
        "c++":54,
        "java": 62,
        "javascript": 63
    }

    return language[lang.toLowerCase()]

}

const submitBatch = async (submissions) => {
    try {
        if (!submissions || submissions.length === 0) {
            throw new Error("No submissions provided");
        }

        const encodedSubmissions = submissions.map((sub) => ({
            language_id: sub.language_id,
            source_code: Base64.encode(sub.source_code),
            stdin: Base64.encode(sub.stdin || ""),
            expected_output: Base64.encode(sub.expected_output || "")
        }));

        const options = {
            method: "POST",
            url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
            params: {
                base64_encoded: "true"
            },
            headers: {
                "x-rapidapi-key": process.env.RAPID_API_KEY,
                "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                "Content-Type": "application/json"
            },
            data: {
                submissions: encodedSubmissions
            }
        };

        const response = await axios.request(options);

        if (!response.data || !Array.isArray(response.data)) {
            throw new Error("Invalid response from Judge0");
        }

        return response.data;

    } catch (error) {
        console.error(
            "Batch Error:",
            error.response?.data || error.message
        );

        throw new Error(`submitBatch failed: ${error.message}`);
    }
};



const submitToken = async (tokens) => {
    try {
        if (!tokens || tokens.length === 0) {
            throw new Error("No tokens provided");
        }

        const options = {
            method: "GET",
            url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
            params: {
                tokens: tokens.join(","),
                base64_encoded: "true",
                fields: "*"
            },
            headers: {
                "x-rapidapi-key": process.env.RAPID_API_KEY,
                "x-rapidapi-host": "judge0-ce.p.rapidapi.com"
            }
        };

        const response = await axios.request(options);

        if (
            !response.data ||
            !Array.isArray(response.data.submissions)
        ) {
            throw new Error("Invalid response from Judge0");
        }

        const decodedSubmissions = response.data.submissions.map((sub) => ({
            ...sub,

            source_code: sub.source_code
                ? Base64.decode(sub.source_code)
                : null,

            stdout: sub.stdout
                ? Base64.decode(sub.stdout)
                : null,

            stderr: sub.stderr
                ? Base64.decode(sub.stderr)
                : null,

            compile_output: sub.compile_output
                ? Base64.decode(sub.compile_output)
                : null,

            message: sub.message
                ? Base64.decode(sub.message)
                : null,

            stdin: sub.stdin
                ? Base64.decode(sub.stdin)
                : null,

            expected_output: sub.expected_output
                ? Base64.decode(sub.expected_output)
                : null
        }));

        return {
            submissions: decodedSubmissions
        };

    } catch (error) {
        console.error(
            "Token Error:",
            error.response?.data || error.message
        );

        throw new Error(
            `submitToken failed: ${error.message}`
        );
    }
};

const checkStatus = async (tokens) => {
    try {
        while (true) {
            const result = await submitToken(tokens);

            const submissions = result.submissions;

            const isComplete = submissions.every(
                (submission) => submission.status.id >= 3
            );

            if (isComplete) {
                return submissions;
            }

            await new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
        }

    } catch (error) {
        throw new Error(`Check status failed: ${error.message}`);
    }
};


module.exports = {getId,submitBatch,submitToken,checkStatus}