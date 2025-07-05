import express from "express";
import { authenticateUser, createUserAccount, signOut, currentUserProfile, updateUserProfile, changePassword, resetPassword, deleteUserAccount } from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import upload from "../utils/multer.js";
import { validateSignup,validatePasswordChange } from "../middleware/validation.middleware.js";

const router = express.Router();

router.post('/signup',validateSignup,createUserAccount);
router.post('/signin',authenticateUser);
router.post('/signout',signOut);

router.get('/profile',isAuthenticated,currentUserProfile);
router.patch('/profile',isAuthenticated,upload.single('avatar'),updateUserProfile);

router.patch('/change-password',isAuthenticated,validatePasswordChange,changePassword);
router.patch('/reset-password',validatePasswordChange,resetPassword);

router.delete('/account',isAuthenticated,deleteUserAccount);

export default router;