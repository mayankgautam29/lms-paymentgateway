import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true,"Title for the course is required"],
        trim: true,
        maxLength: [100, "Course title cannot exceed 100 characters"]
    },
    subtitle: {
        type: String,
        trim: true,
        maxLength: [200,"Course subtitle cannot exceed 200 characters"]
    },
    description: {
        type: String,
        maxLength: [500,"Course desc cannot exceed 500 characters"], //title,subtitle,description,category,levels,price,thumbnail
        trim: true
    },
    category: {
        type: String,
        required: [true,"Category for the course is required"],
        trim: true
    },
    levels: {
        type: String,
        enum: {
            values: ["beginner","intermediate","advanced"],
            message: "Please select a valid course level"
        },
        default: "beginner"
    },
    price: {
        type: Number,
        required: [true,"Course price is required"],
        min: [0, "Course price must be a non-negetive number"]
    },
    thumbnail: {
        type: String,
        required: [true,"Thumbnail is required"]
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    lectures: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
    }],
    instructor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true,"A course must have a instructor"]
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    totalDuration: {
        type: Number,
        default: 0
    },
    totalLectures: {
        type: Number,
        default: 0
    }
},{
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

courseSchema.virtual("averageRating").get(function(){
    return 0;
})
courseSchema.pre('save',function(next){
    if(this.lectures){
        this.totalLectures = this.lectures.length
    }
    next()
})

export const Course = mongoose.model("Course",courseSchema);