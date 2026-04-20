module.exports = (sequelize, DataTypes) => {
  const Registration = sequelize.define(
    "Registration",
    {
      reg_id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      title: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      orgName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      // ✅ Newly added fields
      deptSubCat: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      deptName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      docId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      docIdtype: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      ownContact: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          is: /^\d{10}$/, // any 10-digit number
        },
      },
      ownAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      village_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "villages",
          key: "village_code",
        },
      },
      subdistrict_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "subdistricts",
          key: "subdistrict_code",
        },
      },
      district_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "districts",
          key: "district_code",
        },
      },
      isOrg: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: "registration_tbl",
      timestamps: false,
    }
  );

  // ✅ Associations
  Registration.associate = (models) => {
    Registration.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    Registration.belongsTo(models.Village, {
      foreignKey: "village_code",
      as: "village",
      targetKey: "village_code",
    });

    Registration.belongsTo(models.Subdistrict, {
      foreignKey: "subdistrict_code",
      as: "subdistrict",
      targetKey: "subdistrict_code",
    });

    Registration.belongsTo(models.District, {
      foreignKey: "district_code",
      as: "district",
      targetKey: "district_code",
    });
  };

  // ✅ Safe return method
  Registration.prototype.toSafeObject = function () {
    const { ...safeReg } = this.toJSON();
    return safeReg;
  };

  return Registration;
};
