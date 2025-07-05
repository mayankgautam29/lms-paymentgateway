import { ApiError, catchAsync } from "../middleware/error.middleware";
import { Course } from "../models/course.model";
import uploadMedia, { deleteMedia } from "../utils/cloudinary";
import { User } from "../models/user.model.js";
import { Lecture } from "../models/lecture.model";

export const createCourse = catchAsync(async (req, res) => {
  const { title, subtitle, description, category, levels, price } = req.body;

  let thumbnail;
  if (req.file) {
    const result = await uploadMedia(req.file.path);
    thumbnail = result?.secure_url || req.file.path;
  } else {
    throw new ApiError("Course thumbnail is required", 400);
  }
  const course = await Course.create({
    title,
    subtitle,
    description,
    category,
    levels,
    price,
    thumbnail,
    instructor: req.id,
  });

  await User.findByIdAndUpdate(req.id, {
    $push: { createdCourses: course._id },
  });
  res.status(200).json({
    success: true,
    message: "Course created successfully",
    data: course,
  });
});

export const searchCourses = catchAsync(async (req, res) => {
  const {
    query = "",
    categories = [],
    level,
    priceRange,
    sortBy = "newest",
  } = req.query;

  const searchCriteria = {
    isPublished: true,
    $or: [
      { title: { $regex: query, $options: "i" } },
      { subtitle: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  };

  if (categories.length > 0) {
    searchCriteria.category = { $in: categories };
  }
  if (level) {
    searchCriteria.level = level;
  }
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    searchCriteria.price = { $gte: min || 0, $lte: max || Infinity };
  }

  const sortOptions = {};
  switch (sortBy) {
    case "price-low":
      sortOptions.price = 1;
      break;
    case "price-high":
      sortOptions.price = -1;
      break;
    case "oldest":
      sortOptions.createdAt = 1;
      break;
    default:
      sortOptions.createdAt = -1;
  }

  const courses = await Course.find(searchCriteria)
    .populate({
      path: "instructor",
      select: "name avatar",
    })
    .sort(sortOptions);

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

export const getPublishedCourses = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const [course, total] = await Promise.all([
    Course.find({ isPublished: true })
      .populate({
        path: "instructor",
        select: "name avatar",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments({ isPublished: true }),
  ]);
  res.status(200).json({
    success: true,
    data: course,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getMyCreatedCourses = catchAsync(async (req, res) => {
  const courses = await Course.findOne({ instructor: req.id }).populate({
    path: "enrolledStudents",
    select: "name avatar",
  });
  res.status(200).json({
    success: true,
    data: courses,
    count: courses.length,
  });
});

export const updateCourseDetails = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { title, subtitle, description, category, levels, price } = req.body;
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError("Course not found", 404);
  }
  if (course.instructor.toString() !== req.id) {
    throw new ApiError("Not allowed to update this course", 403);
  }
  let thumbnail;
  if (req.file) {
    if (course.thumbnail) {
      await deleteMedia(course.thumbnail);
    }
    const result = await uploadMedia(req.file.path);
    thumbnail = result?.secure_url || req.file.path;
  }
  const updatedCourses = await Course.findByIdAndUpdate(
    courseId,
    {
      title,
      subtitle,
      description,
      category,
      levels,
      price,
      ...(thumbnail && { thumbnail }),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: updatedCourses,
    message: "Course updated successfully",
  });
});

export const getCourseDetails = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId)
    .populate({
      path: "instructor",
      select: "name avatar bio",
    })
    .populate({
      path: "lectures",
      select: "title videoUrl duration isPreview order",
    });
  if (!course) {
    throw new ApiError("Course not found", 404);
  }
  res.status(200).json({
    success: true,
    data: {
      ...course.toJSON(),
      averageRating: course.averageRating,
    },
    message: "Course fetched successfully",
  });
});

export const addLectureToCourse = catchAsync(async(req,res) => {
    const {title,description,isPreview} = req.body;
    const {courseId} = req.params;

    const course = await Course.findById(courseId);
    if(!course){
        throw new ApiError("Course not found",404);
    }
    if(course.instructor.toString() !== req.id){
        throw new ApiError("Not allowed to make changes in this course!",403);
    };
    if(!req.file){
        throw new ApiError("Video file is required",400);
    }
    const result = await uploadMedia(req.file.path);
    if(!result){
        throw new ApiError("Error uploading the video",500);
    };
    const lecture = await Lecture.create({
        title,
        description,
        isPreview,
        order: course.lectures.length + 1,
        videoUrl: result?.secure_url || req.file.path,
        publicId: result?.public_id || req.file.path,
        duration: result?.duration || 0,
    })
    course.lectures.push(lecture._id);
    res.status(200).json({
        success: true,
        data: lecture,
        message: "Lecture added successfully"
    })
});

export const getCourseLecture = catchAsync(async(req,res) => {
    const course = await Course.findById(req.params.courseId).populate({
        path: "lectures",
        select: "title description videoUrl duration isPreview order",
        options: {sort: {order :1}}
    })
    if(!course){
        throw new ApiError("Course not found",404);
    }
    const isEnrolled = course.enrolledStudents.includes(req.id);
    const isInstructor = course.instructor.includes(req.id);
    let lectures = course.lectures;
    if(!isEnrolled && !isInstructor){
        lectures = lectures.filter((lecture) => lecture.isPreview);
    }
    res.status(200).json({
        success: true,
        data: {
            lectures,
            isEnrolled,
            isInstructor
        }
    })
})