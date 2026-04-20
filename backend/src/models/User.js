const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
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
      // firstName: {
      //   type: DataTypes.STRING,
      //   allowNull: true,
      //   validate: { len: [1, 50] },
      // },
      // lastName: {
      //   type: DataTypes.STRING,
      //   allowNull: true,
      //   validate: { len: [1, 50] },
      // },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lastLoginAt: DataTypes.DATE,
      refreshToken: DataTypes.TEXT,
    },
    {
      tableName: "users",
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
    }
  );

  User.associate = (models) => {
    User.hasOne(models.Registration, {
      foreignKey: "userId",
      as: "registration",
    });
  };

  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.toSafeObject = function () {
    const { password, refreshToken, ...safeUser } = this.toJSON();
    return safeUser;
  };

  return User;
};
