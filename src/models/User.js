// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const UserSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//       minlength: [2, "Name must be at least 2 characters"],
//       maxlength: [50, "Name cannot exceed 50 characters"],
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
//     },
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//       minlength: [8, "Password must be at least 8 characters"],
//       select: false,
//     },
//     role: {
//       type: String,
//       enum: ["user", "moderator", "admin"],
//       default: "user",
//     },
//     // Security Question for password reset
//     securityQuestion: {
//       type: String,
//       required: [true, "Security question is required"],
//     },
//     securityAnswer: {
//       type: String,
//       required: [true, "Security answer is required"],
//       select: false,
//     },
//     isEmailVerified: { type: Boolean, default: true },
//     emailVerificationToken: { type: String, select: false },
//     emailVerificationExpires: { type: Date, select: false },
//     passwordResetToken: { type: String, select: false },
//     passwordResetExpires: { type: Date, select: false },
//     refreshToken: { type: String, select: false },
//     isActive: { type: Boolean, default: true },
//     lastLogin: { type: Date },
//   },
//   { timestamps: true }
// );

// UserSchema.index({ email: 1 });

// UserSchema.pre("save", async function (next) {
//   if (this.isModified("password")) {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//   }
//   // Hash security answer too
//   if (this.isModified("securityAnswer")) {
//     const salt = await bcrypt.genSalt(10);
//     this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase().trim(), salt);
//   }
//   next();
// });

// UserSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// UserSchema.methods.compareSecurityAnswer = async function (candidateAnswer) {
//   return bcrypt.compare(candidateAnswer.toLowerCase().trim(), this.securityAnswer);
// };

// UserSchema.methods.toPublicProfile = function () {
//   return {
//     id: this._id,
//     name: this.name,
//     email: this.email,
//     role: this.role,
//     securityQuestion: this.securityQuestion,
//     isEmailVerified: this.isEmailVerified,
//     isActive: this.isActive,
//     lastLogin: this.lastLogin,
//     createdAt: this.createdAt,
//   };
// };

// module.exports = mongoose.model("User", UserSchema);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    // Security Question for password reset
    securityQuestion: {
      type: String,
      required: [true, "Security question is required"],
    },
    securityAnswer: {
      type: String,
      required: [true, "Security answer is required"],
      select: false,
    },
    isEmailVerified: { type: Boolean, default: true },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // Hash security answer too
  if (this.isModified("securityAnswer")) {
    const salt = await bcrypt.genSalt(10);
    this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase().trim(), salt);
  }
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.compareSecurityAnswer = async function (candidateAnswer) {
  return bcrypt.compare(candidateAnswer.toLowerCase().trim(), this.securityAnswer);
};

UserSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    securityQuestion: this.securityQuestion,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
