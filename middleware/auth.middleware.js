import { ApiError, catchAsync } from "./error.middleware";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsync(async(req,res,next) => {
    const token = req.cookies.token;
    if(!token){
        throw new ApiError("You are not logged in",401);
    }
    try {
        const decoded = await jwt.verify(token,process.env.SECRET_KEY);
        req.id = decoded.userId;
        next()
    } catch (error) {
        console.error(error)
        throw new ApiError("Jwt token error",401);
    }
})

export const restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        "You do not have permission to perform this action",
        403
      );
    }
    next();
  });
};