const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Product = require('./Product');

const InventoryLog = sequelize.define('InventoryLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Product, key: 'id' },
  },
  qtyChange: {
    type: DataTypes.INTEGER, // positive = stock in, negative = stock out
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('stock_in', 'stock_out', 'order', 'adjustment'),
    allowNull: false,
  },
  note: DataTypes.STRING,
}, {
  timestamps: true,
});

InventoryLog.belongsTo(Product, { foreignKey: 'productId' });

module.exports = InventoryLog;
