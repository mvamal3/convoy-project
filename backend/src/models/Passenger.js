module.exports = (sequelize, DataTypes) => {
  const Passenger = sequelize.define(
    "Passenger",
    {
      pId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      passengerName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      isForeigner: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0, // 0 = Indian, 1 = Foreigner
      },

      fatherName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      phoneNo: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      gender: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },

      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      docType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      docId: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      nationality: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      visaNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      residence: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "passenger_tbl",
      timestamps: false,
    },
  );

  Passenger.associate = (models) => {
    Passenger.belongsToMany(models.Trip, {
      through: models.tripRelation,
      foreignKey: "pId",
      otherKey: "tId",
      as: "trips",
    });
  };

  return Passenger;
};
