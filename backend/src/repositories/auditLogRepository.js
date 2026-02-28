const AuditLog = require("../models/AuditLog");

const createAuditLog = (payload) => AuditLog.create(payload);

const findAuditLogs = (skip, limit) =>
  AuditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);

const countAuditLogs = () => AuditLog.countDocuments();

module.exports = {
  createAuditLog,
  findAuditLogs,
  countAuditLogs,
};
