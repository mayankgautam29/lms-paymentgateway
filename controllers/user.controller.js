import { User } from "../models/user.model.js";
import { ApiError, catchAsync } from "../middleware/error.middleware.js";
import { generateToken } from "../utils/generateToken.js";
import { deleteMedia, uploadMedia } from "../utils/cloudinary.js";

export const createUserAccount = catchAsync(async (req, res) => {
  const { name, email, password, role = "student" } = req.body;
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError("User already exists", 400);
  }
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
  });
  await user.updateLastActive();
  generateToken(res, user, "Account created successfully");
});

export const authenticateUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email: email }).select("+password");
  if (!existingUser || !(await existingUser.comparePassword(password))) {
    throw new ApiError("Invalid email or password", 401);
  }
  await existingUser.updateLastActive();
  generateToken(res, existingUser, `Welcome back ${existingUser.name}`);
});

export const signOut = catchAsync(async (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.status(200).json({
    success: true,
    message: "Signedout successfully",
  });
});

export const currentUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.id).populate({
    path: "enrolledCourses.course",
    select: "title thumbnail description",
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),
      totalEnrolledCourses: user.totalEnrolledCourses,
    },
  });
});

export const updateUserProfile = catchAsync(async (req, res) => {
  const { name, email, bio } = req.body;
  const updateData = { name, email: email?.toLowerCase(), bio };
  if (req.file) {
    const avatarResult = await uploadMedia(req.file.path);
    updateData.avatar = avatarResult.secure_url;
    const user = await User.findById(req.id);
    if (
      user.avatar &&
      user.avatar !==
        "https://icons.iconarchive.com/icons/papirus-team/papirus-status/512/avatar-default-icon.png"
    ) {
      await deleteMedia(user.avatar);
    }
  }
  const updatedUser = await User.findByIdAndUpdate(req.id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!updatedUser) {
    throw new ApiError("User not found", 404);
  }
  res.status(200).json({
    success: true,
    message: "profile updated successfully",
    data: updatedUser,
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.id).select("+password");
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError("Incorrect current password", 401);
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
    message: "Password reset link was sent to email",
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: crypto.createHash("sha256").update(token).digest("hex"),
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError("Invalid token", 400);
  }
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  res.status(200).json({
    success: true,
    message: "Password for reset successfully",
  });
});

export const deleteUserAccount = catchAsync(async (req, res) => {
  const user = await User.findById(req.id);
  if (user.avatar && user.avatar !== "default-avatar.png") {
    await deleteMediaFromCloudinary(user.avatar);
  }
  await User.findByIdAndDelete(req.id);
  res.cookie("token","",{maxAge: 0});
  res.status(200).json({
    success: true,
    message: "User account deletion successfull"
  })
});