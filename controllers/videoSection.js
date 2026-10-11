const cloudinary = require('cloudinary').v2;
const Problem = require("../models/problem");
const User = require("../models/user");
const SolutionVideo = require("../models/video");
const { sanitizeFilter } = require('mongoose');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateUploadSignature = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.result._id;

    if (!problemId) {
      return res.status(400).json({
        error: "Problem ID is required"
      });
    }

    const problem = await Problem.findById(problemId).select("_id");

    if (!problem) {
      return res.status(404).json({
        error: "Problem not found"
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;

    const uploadParams = {
      timestamp,
      public_id: publicId
    };

    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

//    const thumbnailUrl = cloudinary.url(publicId, {
//   resource_type: "video",
//   type: "upload",
//   transformation: [
//     {
//       width: 640,
//       height: 360,
//       crop: "fill",
//       start_offset: "0"
//     }
//   ],
//   format: "jpg"
// });

const thumbnailUrl =
  `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_0,w_640,h_360,c_fill/${publicId}.jpg`;

    console.log(thumbnailUrl)

    return res.status(200).json({
      signature,
      timestamp,
      public_id: publicId,
      thumbnail_url: thumbnailUrl,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`
    });

  } catch (error) {
    console.error("Generate upload signature error:", error);

    return res.status(500).json({
      error: "Failed to generate upload credentials"
    });
  }
};



const saveVideoMetadata = async (req, res) => {
  try {
    const {
      problemId,
      cloudinaryPublicId,
      secureUrl,
      duration,
    } = req.body;

    const userId = req.result._id;

    // Verify the upload with Cloudinary
    const cloudinaryResource = await cloudinary.api.resource(  // return mutiple data about video like duration,publicid etc
      cloudinaryPublicId,
      {
        resource_type: "video",
      }
    );

    if (!cloudinaryResource) {
      return res.status(400).json({
        error: "Video not found on Cloudinary",
      });
    }

    // Check if video already exists for this problem and user
    const existingVideo = await SolutionVideo.findOne({
      problemId,
      userId,
      cloudinaryPublicId,
    });

    if (existingVideo) {
      return res.status(409).json({
        error: "Video already exists",
      });
    }

    // Generate thumbnail URL
    const thumbnailUrl = cloudinary.image(
      cloudinaryResource.public_id,
      {
        resource_type: "video",
      }
    );

    // Create video solution record
    const videoSolution = await SolutionVideo.create({
      problemId,
      userId,
      cloudinaryPublicId,
      secureUrl,
      duration: cloudinaryResource.duration || duration,
      thumbnailUrl,
    });

    return res.status(201).json({
      message: "Video solution saved successfully",
      videoSolution: {
        id: videoSolution._id,
        thumbnailUrl: videoSolution.thumbnailUrl,
        duration: videoSolution.duration,
        uploadedAt: videoSolution.createdAt,
      },
    });

  } catch (error) {
    console.error("Error saving video metadata:", error);

    return res.status(500).json({
      error: "Failed to save video metadata",
    });
  }
};




const deleteVideo = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.result._id;

    const video = await SolutionVideo.findOneAndDelete({problemId:problemId});
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' , invalidate: true });

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};


const getMetaData = async (req, res) => {
  try {
    const { problemId } = req.params;

    const data = await SolutionVideo.findOne({ problemId });

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {generateUploadSignature,saveVideoMetadata,deleteVideo,getMetaData};