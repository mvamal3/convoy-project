module.exports = (sequelize, DataTypes) => {
  const Village = sequelize.define('Village', {
    village_code: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    village_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    subdistrict_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subdistricts',
        key: 'subdistrict_code'
      }
    }
  }, {
    tableName: 'villages',
    timestamps: false
  });

  Village.prototype.toSafeObject = function () {
    const { ...safeVillage } = this.toJSON();
    return safeVillage;
  };

  Village.associate = function(models) {
    Village.belongsTo(models.Subdistrict, {
      foreignKey: 'subdistrict_code',
      as: 'subdistrict'
    });
  };

  return Village;
};