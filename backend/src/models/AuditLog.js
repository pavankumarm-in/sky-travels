const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    entity: { type: String, required: true, trim: true },
    entityId: { type: String, required: true, trim: true },
    performedBy: { type: String, required: true, trim: true },
    oldData: { type: Object, default: null },
    newData: { type: Object, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
