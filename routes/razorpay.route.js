import express from "express";
import {isAuthenticated} from "../middleware/auth.middleware.js"
import { createRazorpayOrder, verifyPayment } from "../controllers/razorpay.controller";


const router = express.Router();

router.get("/create-order",isAuthenticated,createRazorpayOrder);
router.get("/verify-payment",isAuthenticated,verifyPayment);

export default router;