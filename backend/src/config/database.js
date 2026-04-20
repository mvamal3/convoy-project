// const { Sequelize } = require('sequelize');
// const config = require('./environment');

// const sequelize = new Sequelize(
//   config.DB_NAME,
//   config.DB_USER,
//   config.DB_PASS,
//   {
//     host: config.DB_HOST,
//     port: config.DB_PORT,
//     dialect: 'mysql',
//     logging: config.NODE_ENV === 'development' ? console.log : false,
//     pool: {
//       max: 10,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     },
//     define: {
//       timestamps: true,
//       underscored: true,
//       paranoid: true // Soft deletes
//     }
//   }
// );

// module.exports = sequelize;