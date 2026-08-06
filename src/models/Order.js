const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Address = require('./Address');

const Order = sequelize.define('Order', {
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
  addressId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Address, key: 'id' },
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: User, key: 'id' }, // a User with role = delivery_partner
  },
  items: {
    type: DataTypes.JSONB, // [{ productId, name, qty, price }]
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paymentType: {
    type: DataTypes.ENUM('cod', 'online', 'subscription'),
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending',
  },
  status: {
    type: DataTypes.ENUM('placed', 'confirmed', 'dispatched', 'delivered', 'cancelled'),
    defaultValue: 'placed',
  },
  deliveryDate: DataTypes.DATE,
}, {
  timestamps: true,
});

Order.belongsTo(User, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'assignedTo', as: 'deliveryPartner' });
Order.belongsTo(Address, { foreignKey: 'addressId' });

module.exports = Order;
