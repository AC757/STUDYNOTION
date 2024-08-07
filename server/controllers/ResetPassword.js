const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const bcrypt= require("bcrypt")
const crypto = require("crypto")

//resetPasswordToken(to send mail)
exports.resetPasswordToken = async (req,res) => {
    try{
    // get email from request body
    const email =req.body.email;
    // check user for this email, email validation
    const user= await User.findOne({email: email})
    if(!user) {
        return res.json({
            success:false,
            message:'Your Email is not registered with us'
        });
    }

    // generate token
    const token = crypto.randomBytes(20).toString("hex");
    // update user by adding token & expiration time
    const updatedDetails = await User.findOneAndUpdate(
                                    {email:email},
                                    {
                                        token:token,
                                        resetPasswordExpires: Date.now() + 5*60*1000,
                                    },
                                    {new:true});
    console.log("DETAILS", updatedDetails);

    // create url(ur of front end)
    const url = `https://study-notion-frontend-wheat.vercel.app/update-password/${token}`

    // send mail containing the url
    await mailSender(email,
                    "Password Reset",
                    `Your Link for email verification is ${url}. Please click this url to reset your password.`
                );
    // return response
    return res.json({
        success:true,
        message:"Email sent successfully, please check your email inbox and change password"
    });
    }
    catch(error){
        return res.status(500).json({
            error:error.message,
            success:false,
            message:"Something went wrong while sending mail to reset password"
        })
    };   
}


//reset password(updates current passsword with new password in db)
exports.resetPassword= async (req,res) => {
    try{
        // data fetch(front end has given this token)
        const {password, confirmPassword, token} = req.body;
        // validation
        if(password !== confirmPassword){
            return res.json({
                success:false,
                message:'Password & Confirm Password does not match'
            });
        }
        // get user details from db using token
        const userDetails = await User.findOne({token: token});
        // if no entry -> invalid token
        if(!userDetails){
            return res.status(403).json({
                success:false,
                message:"Token is invalid",
            })
        }
        // token time check (if expires isliye invalid token)
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success:false,
                message:`Token is expired, please regenerate your token`
            })
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // password update 
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
            {new:true},
        )
        // return response
        return res.status(200).json({
            success:true,
            message:"Password reset successfull"
        })
    }
    catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
	}

}