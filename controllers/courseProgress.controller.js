import { ApiError, catchAsync } from "../middleware/error.middleware";
import { Course } from "../models/course.model";
import { CourseProgress } from "../models/courseProgress";
import { Lecture } from "../models/lecture.model";

export const getUserCourseProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const courseDetails = await Course.findById(courseId)
    .populate("lectures")
    .select("title thumbnail lectures");
  if (!courseDetails) {
    throw new ApiError("Course not found", 404);
  }
  const courseProgress = await CourseProgress.findOne({
    course: courseId,
    user: req.id,
  }).populate("course");
  if (!courseProgress) {
    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        progress: [],
        isCompleted: false,
        completionPercentage: 0,
      },
    });
  }

  const totalLectures = courseDetails.lectures.length;
  const completedLectures = courseProgress.lectureProgress.filter(
    (lp) => lp.isCompleted
  ).length;
  const completionPercentage = Math.round(
    (completedLectures / totalLectures) * 100
  );
  res.status(200).json({
    success: true,
    data: {
      courseDetails,
      progress: courseProgress.lectureProgress,
      isCompleted: courseProgress.isCompleted,
      completionPercentage,
    },
  });
});

export const updateLectureProgress = catchAsync(async (req, res) => {
  const { courseId, lectureId } = req.params;
  let courseProgress = await CourseProgress.findOne({
    course: courseId,
    user: req.id,
  });
  if (!courseProgress) {
    courseProgress = await CourseProgress.create({
      user: req.id,
      course: courseId,
      isCompleted: false,
      lectureProgress: [],
    });
  }
  const lectureIndex = courseProgress.lectureProgress.findIndex(
    (lecture) => lecture.lecture === lectureId
  );
  if (lectureIndex !== -1) {
    courseProgress.lectureProgress[lectureIndex].isCompleted = true;
  } else {
    courseProgress.lectureProgress.push({
      lecture: lectureId,
      isCompleted: true,
    });
  }
  const course = await Course.findById(courseId);
  const completedLectures = courseProgress.lectureProgress.filter(
    (lp) => lp.isCompleted
  ).length;
  courseProgress.isCompleted = course.lectures.length === completedLectures;

  await courseProgress.save();

  res.status(200).json({
    success: true,
    message: "Lecture progress updated successfully",
    data: {
      lectureProgress: courseProgress.lectureProgress,
      isCompleted: courseProgress.isCompleted,
    },
  });
});

export const markCourseAsCompleted = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const courseProgress = await CourseProgress.findOne({
    course: courseId,
    user: req.id,
  });
  if (!courseProgress) {
    throw new ApiError("Course progress not found", 404);
  }
  courseProgress.lectureProgress.forEach((progress) => {
    progress.isCompleted = true;
  });
  courseProgress.isCompleted = true;

  await courseProgress.save();

  res.status(200).json({
    success: true,
    message: "Course marked as completed",
    data: courseProgress,
  });
});

export const resetProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const courseProgress = CourseProgress.findOne({
    course: courseId,
    user: req.id,
  });
  if (!courseProgress) {
    throw new ApiError("Course progress not found", 404);
  }
  courseProgress.lectureProgress.forEach((progress) => {
    progress.isCompleted = false;
  });
  courseProgress.isCompleted = false;

  await courseProgress.save();

  res.status(200).json({
    success: true,
    message: "Course progress reset successfully",
    data: courseProgress,
  });
});