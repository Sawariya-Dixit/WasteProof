import mongoose from 'mongoose';

const { ObjectId, Mixed } = mongoose.Schema.Types;

const adminLogSchema = new mongoose.Schema(
  {
    adminId: { type: ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // report.approve, report.reject, areas.import, rep.create ...
    targetType: String,
    targetId: String,
    reason: String,
    meta: { type: Mixed, default: {} },
  },
  { timestamps: true },
);

adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ adminId: 1, createdAt: -1 });

export const AdminLog = mongoose.model('AdminLog', adminLogSchema);