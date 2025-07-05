import mongoose, { mongo } from "mongoose";


const coursePurchaseSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course reference is required"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"]
    },
    amount: {
        type: Number,
        required: [true,"Purchase amount is required"],
        min: [0,"Purchase amount cannot be negetive"]
    },
    currency: {
        type: String,
        required: [true,"Purchase currency is required"],
        uppercase: true,
        default: "INR"
    },
    status: {
        type: String,
        enum: {
            values: ["pending","completed","failed","refunded"],
            message: "Please select payment status"
        },
        default: "pending"
    },
    paymentMethod: {
        type: String,
        required: [true,"Payment method is required"]
    },
    paymentId: {
        type: String,
        required: [true,"Payment Id is required"]
    },
    refundId: {
        type: String
    },
    refundAmount: {
        type: Number,
        min: [0,"Refund amount cannot be negetive"]
    },
    refundReason: {
        type: String
    },
    metadata: {
        type: Map,

    }
},{
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

coursePurchaseSchema.index({user: 1,course: 1})
coursePurchaseSchema.index({status: 1})

coursePurchaseSchema.virtual('isRefundable').get(function(){
    if(this.status !== 'completed') return false;
    const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.createdAt > thirtyDays
})

coursePurchaseSchema.methods.processRefund = async function(reason,amount){
    this.status = 'refunded';
    this.reason = reason;
    this.refundAmount = amount || this.amount;
    return this.save();
}

export const CoursePurchase = mongoose.model("CoursePurchase",coursePurchaseSchema);