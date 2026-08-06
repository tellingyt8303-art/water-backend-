const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Product = require('./Product');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Product, key: 'id' },
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: false,
  },
  quantityPerDelivery: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  nextDeliveryDate: DataTypes.DATE,
  status: {
    type: DataTypes.ENUM('active', 'paused', 'cancelled'),
    defaultValue: 'active',
  },
  razorpaySubscriptionId: DataTypes.STRING, // for auto-recurring payment
}, {
  timestamps: true,
});

Subscription.belongsTo(User, { foreignKey: 'userId' });
Subscription.belongsTo(Product, { foreignKey: 'productId' });

module.exports = Subscription;
