import { body, param, query, validationResult } from "express-validator";
import { ApiError } from "./error.middleware";

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const extractedError = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    throw new Error("Validation Error");
  };
};

export const commonValidation = {
  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be btw 1 and 100"),
  ],
  email: body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  name: body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Please provide a valid name"),
};

export const validateSignup = validate([commonValidation.email,commonValidation.name]);

export const validatePasswordChange = validate([
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        })
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character')
]);
