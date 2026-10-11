const { register, login, logout, adminRegister, deleteProfile } = require("../controllers/userAuth")
const express = require("express")
const authRouter = express.Router()
const userMiddleware = require("../middleware/userMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")

authRouter.post("/register",register)
authRouter.post("/login",login)
authRouter.post("/logout",userMiddleware,logout)
authRouter.post("/admin/register",adminMiddleware, adminRegister)

authRouter.delete("/deleteProfile",userMiddleware,deleteProfile)

authRouter.get("/check",userMiddleware, (req,res)=>{
    const reply = {
            _id: req.result._id,
            firstName: req.result.firstName,
            emailId: req.result.emailId,
            role: req.result.role
        };

        res.status(200).json({
            user: reply,
            message: "valid user"
        })
})



module.exports = authRouter