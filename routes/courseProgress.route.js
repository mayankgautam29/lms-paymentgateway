import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  getUserCourseProgress,
  updateLectureProgress,
  markCourseAsCompleted,
  resetProgress,
} from "../controllers/courseProgress.controller.js";

const router = express.Router();

router.get("/:courseId", isAuthenticated, getUserCourseProgress);
router.patch(
  "/:courseId/lectures/:lectureId",
  isAuthenticated,
  updateLectureProgress
);
router.patch("/:courseId/complete", isAuthenticated, markCourseAsCompleted);
router.patch("/:courseId/reset", isAuthenticated, resetProgress);
export default router;
