const mongoose = require("mongoose");

const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    problemId: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      enum: ["c++", "java", "javascript"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Compilation Error",
        "Runtime Error",
        "Error",
      ],
      default: "pending",
      required: true,
    },

    runtime: {
      type: Number,
      default: 0,
    },

    memory: {
      type: Number,
    },

    errorMessage: {
      type: String,
      default: "",
    },

    testCasesPassed: {
      type: Number,
      default: 0,
    },
    testCasesTotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);
submissionSchema.index({userId:1 , problemId:1})

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;
