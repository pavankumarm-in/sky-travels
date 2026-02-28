const auditLogRepository = require("../repositories/auditLogRepository");

const createLog = async ({
  action,
  entity,
  entityId,
  performedBy,
  oldData = null,
  newData = null,
}) =>
  auditLogRepository.createAuditLog({
    action,
    entity,
    entityId: String(entityId),
    performedBy,
    oldData,
    newData,
  });

const getAuditLogs = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    auditLogRepository.findAuditLogs(skip, limit),
    auditLogRepository.countAuditLogs(),
  ]);
  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = { createLog, getAuditLogs };
