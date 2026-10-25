import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    cognitoSub: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  },
  { timestamps: true },
);

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    language: this.language,
    theme: this.theme,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
