module.exports = (sequelize, DataTypes) => {
  const Officer = sequelize.define('Officer', {
    oId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // assuming the user table is named 'users'
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    oName: {
      type: DataTypes.STRING(255), // usually names are strings, but keeping INT as per your schema
      allowNull: true,
      defaultValue: null
    },
    empId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    designation: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'officer_tbl',
    timestamps: false
  });

  // ✅ Association with User
  Officer.associate = (models) => {
    Officer.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  // ✅ Optional: toSafeObject method (if needed)
  Officer.prototype.toSafeObject = function () {
    const { ...safeOfficer } = this.toJSON();
    return safeOfficer;
  };

  return Officer;
};
