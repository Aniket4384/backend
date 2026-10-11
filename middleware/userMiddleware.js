const jwt = require("jsonwebtoken")
const User = require("../models/user");
const redisClient = require("../config/redis");
const dotenv = require("dotenv")
dotenv.config()
const userMiddleware = async(req,res,next)=>{
    try{
        
        const {token} = req.cookies;
        

        if(!token){
            throw new Error("invalid token")
        }

        const payload =  jwt.verify(token, process.env.JWT_SECRET_KEY )   
        const {_id} = payload
        if(!_id){
             throw new Error("id is missing")
        }
        const result = await User.findById(_id)

        if(!result){
            throw new Error("user does not exist")
        }
         // check if it is present in blocklist
        const isBlocked = await redisClient.exists(`token:${token}`)

        if(isBlocked){
            throw new Error("invaild token")
        }

        req.result = result;

        next()


    }

    catch(err){
        res.send("Error: "+err)

    }

}

module.exports = userMiddleware