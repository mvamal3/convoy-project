module.exports = (sequelize, DataTypes) => {
  const PoliceRegistration = sequelize.define(
    "PoliceRegistration",
    {
      reg_id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: null,
      },
      firstName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      designation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      emp_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      // ✅ updated checkpost to reference OriginDestination.id
      checkpost: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "origin_destination", // table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      contact: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: "police_registration_tbl",
      timestamps: false,
    }
  );

  // ✅ Associations
  PoliceRegistration.associate = (models) => {
    PoliceRegistration.belongsTo(models.PoliceUser, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "NO ACTION",
    });

    // ✅ Association with OriginDestination
    PoliceRegistration.belongsTo(models.OriginDestination, {
      foreignKey: "checkpost",
      as: "originDestination",
    });
  };

  return PoliceRegistration;
};
