const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const PoliceUser = sequelize.define(
    "PoliceUser",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { len: [6, 100] },
      },

      // ✅ NEW: Role-based access
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "police",
        validate: {
          isIn: [["police", "admin", "sp", "dsp"]],
        },
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "policeuser",
      timestamps: true, // createdAt, updatedAt

      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    },
  );

  // ✅ Association (unchanged)
  PoliceUser.associate = (models) => {
    PoliceUser.hasOne(models.PoliceRegistration, {
      foreignKey: "userId",
      as: "registration",
      onDelete: "CASCADE",
      onUpdate: "NO ACTION",
    });
  };

  // ✅ Password validation
  PoliceUser.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  // ✅ Safe response (role INCLUDED, sensitive fields removed)
  PoliceUser.prototype.toSafeObject = function () {
    const { password, refreshToken, ...safeUser } = this.toJSON();
    return safeUser;
  };

  return PoliceUser;
};
