module.exports = (sequelize, DataTypes) => {
  const Nationality = sequelize.define(
    "Nationality",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nationality: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "nationality_master",
      timestamps: false,
    },
  );

  return Nationality;
};
