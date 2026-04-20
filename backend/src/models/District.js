module.exports = (sequelize, DataTypes) => {
  const District = sequelize.define('District', {
    district_code: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    district_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isIn: [[0, 1]]
      }
    }
  }, {
    tableName: 'districts',
    timestamps: false
  });

  District.prototype.toSafeObject = function () {
    const { ...safeDistrict } = this.toJSON();
    return safeDistrict;
  };

  District.associate = function(models) {
    District.hasMany(models.Subdistrict, {
      foreignKey: 'district_code',
      as: 'subdistricts'
    });
  };

  return District;
};