// Audit trail of security-relevant actions (see utils/auditLog.js).
// Rows are only ever inserted, never updated or deleted by the app.
module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      actorType: DataTypes.STRING(10),
      actorId: DataTypes.STRING(64),
      actorName: DataTypes.STRING(100),
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      targetType: DataTypes.STRING(20),
      targetId: DataTypes.STRING(64),
      ip: DataTypes.STRING(45),
      userAgent: DataTypes.STRING(255),
      details: DataTypes.STRING(500),
    },
    {
      tableName: "audit_log",
      timestamps: true,
      updatedAt: false,
    },
  );

  return AuditLog;
};
