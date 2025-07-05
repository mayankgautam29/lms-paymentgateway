import express from "express";
import { isAuthenticated,restrictTo } from "../middleware/auth.middleware.js";
import {
  createCourse,
  getMyCreatedCourses,
  getPublishedCourses,
  searchCourses,
} from "../controllers/course.controller";
import upload from "../utils/multer.js";

const router = express.Router();

router.get("/published", getPublishedCourses);
router.get("/search", searchCourses);

router.use(isAuthenticated);

router
  .route("/")
  .post(restrictTo("instructor"), upload.single("thumbnail"), createCourse)
  .get(restrictTo("instructor"), getMyCreatedCourses);

router
  .route("/c/:courseId")
  .get(getCourseDetails)
  .patch(
    restrictTo("instructor"),
    upload.single("thumbnail"),
    updateCourseDetails
  );
router
  .route("/c/:courseId/lectures")
  .get(getCourseLectures)
  .post(restrictTo("instructor"), upload.single("video"), addLectureToCourse);

export default router;
