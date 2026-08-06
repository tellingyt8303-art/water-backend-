const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Address = sequelize.define('Address', {
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
  addressLine: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  pincode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: DataTypes.FLOAT,
  longitude: DataTypes.FLOAT,
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

Address.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Address, { foreignKey: 'userId' });

module.exports = Address;
