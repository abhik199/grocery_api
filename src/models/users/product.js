const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");
const category = require("./category");

const product = sequelize.define("product", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: category,
      key: "id",
    },
  },
  name: {
    type: DataTypes.STRING,
  },
  brand: {
    type: DataTypes.STRING,
  },
  price: {
    type: DataTypes.FLOAT,
  },
  discount_price: {
    type: DataTypes.FLOAT,
  },
  discount_percentage: {
    type: DataTypes.FLOAT,
  },
  tag: {
    type: DataTypes.STRING,
  },
});
