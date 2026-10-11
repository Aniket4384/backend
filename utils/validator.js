const validator = require("validator")
const validate = (data)=>{
    const mandatoryField = ['firstName','emailId','password']
    const isAllowed = mandatoryField.every((k)=>Object.keys(data).includes(k))

    if(!isAllowed){
        throw new Error("filed missing")
    }
    if(!validator.isEmail(data.emailId))
        throw new Error("invaild email")
    if(!validator.isStrongPassword(data.password))
        throw new Error("weak password")
    if(!validator.isLength(data.firstName,{min:3,max:28}))
        throw new Error("enter valid name")

}

module.exports = validate