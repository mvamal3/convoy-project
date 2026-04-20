module.exports = (sequelize, DataTypes) => {
  const Subdistrict = sequelize.define('Subdistrict', {
    subdistrict_code: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    subdistrict_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    district_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'districts',
        key: 'district_code'
      }
    }
  }, {
    tableName: 'subdistricts',
    timestamps: false
  });

  Subdistrict.prototype.toSafeObject = function () {
    const { ...safeSubdistrict } = this.toJSON();
    return safeSubdistrict;
  };

  Subdistrict.associate = function(models) {
    Subdistrict.belongsTo(models.District, {
      foreignKey: 'district_code',
      as: 'district'
    });
    Subdistrict.hasMany(models.Village, {
      foreignKey: 'subdistrict_code',
      as: 'villages'
    });
  };

  return Subdistrict;
};