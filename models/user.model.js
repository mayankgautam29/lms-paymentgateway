import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,"Name is required"],
        trim: true,
        maxLength: [50,"Name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true,"Email is required"],
        trim: true,
        unique: true,
        lowercase: true,
        maxLength: [100,"Email cannot exceed 50 characters"],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/,"Please provide a valid email"]
    },
    password: {
        type: String,
        required: [true,"Password is required"],
        minLength: [5,"Password must be atleast characters"],
        select: false
    },
    role: {
        type: String,
        enum: {
            values: ['student','instructor','admin'],
            message: "Please select a valid role",
        },
        default: 'student'
    },
    avatar: {
        type: String,
        default: "https://icons.iconarchive.com/icons/papirus-team/papirus-status/512/avatar-default-icon.png"
    },
    bio: {
        type: String,
        default: "",
        maxLength: [200,"Bio cannot exceed 200 characters"]
    },
    enrolledCourses: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

userSchema.pre("save",async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password,12)
    next();
})

userSchema.methods.comparePassword = async function(enterPassword){
    return await bcrypt.compare(enterPassword,this.password)
}

userSchema.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
        this.resetPasswordExpire = Date.now() + 10 * 60 * 1000
        return resetToken
}

userSchema.virtual('totalEnrolledCourses').get(function(){
    return this.enrolledCourses.length;
})

userSchema.methods.updateLastActive = function (){
    this.lastActive = Date.now();
    return this.lastActive({validateBeforeSave: false})
}

export const User = mongoose.model('User',userSchema);