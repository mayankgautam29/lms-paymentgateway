export const catchAsync = (fn) => {
    return (req,res,next) => {
        fn(req,res,next).catch(next)
    }
}

export class ApiError extends Error {
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true
        Error.captureStackTrace(this,this.constructor);
    }
}

export const JwtError = () => {
    new AppError("Invalid token,Please login again",401);
}