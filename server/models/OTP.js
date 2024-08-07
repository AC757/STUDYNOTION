const mongoose= require("mongoose")
const mailSender = require("../utils/mailSender")
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema= new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt: {
        type:Date,
        default: Date.now,
        expires: 5*60
    }
})


// a fxn -> to send emails
async function sendVerificationEmail(email,otp){
    try{
        const mailResponse= await mailSender(email, "Verification Email from StudyNotion", emailTemplate(otp));
        console.log("Email sent Successfully", mailResponse.response)
    }
    catch(error){
        console.log("Error occured while sending mails", error);
        throw error;
    }
}

// Before saving document in db, mail will be sent with otp
OTPSchema.pre("save", async function (next) {
	console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
	next();
});

// module.exports = mongoose.model("OTP", OTPSchema)  
// OR
const OTP = mongoose.model("OTP", OTPSchema);
module.exports = OTP;