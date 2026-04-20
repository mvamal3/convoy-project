const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../config/environment"); // your DB config

// Create Sequelize instance with timezone fix
const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASS,
  {
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: "mysql",
    logging: config.NODE_ENV === "development" ? console.log : false,

    // ✅ Timezone settings
    timezone: "+05:30", // Change to your timezone offset
    dialectOptions: {
      dateStrings: true, // Return dates as strings, not JS Date objects
      typeCast: true, // Force proper timezone handling for DATE and DATETIME
      timezone: "+05:30",
    },
  }
);

const db = {};
const basename = path.basename(__filename);

// Dynamically import all model files
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file !== basename &&
      file.endsWith(".js") &&
      !file.startsWith(".") &&
      fs.statSync(path.join(__dirname, file)).isFile()
    );
  })
  .forEach((file) => {
    const modelPath = path.join(__dirname, file);
    const modelDef = require(modelPath);

    // Validate the model export is a function
    if (typeof modelDef === "function") {
      const model = modelDef(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } else {
      console.warn(`⚠️  Skipping ${file}: Not exporting a function`);
    }
  });

// Setup associations
Object.keys(db).forEach((modelName) => {
  if (typeof db[modelName].associate === "function") {
    db[modelName].associate(db);
  }
});

// Add Sequelize instance and class to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
