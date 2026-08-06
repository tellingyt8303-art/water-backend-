const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const Order = require('../models/Order');
const User = require('../models/User');
const { Op } = require('sequelize');

// @desc  Add stock to a product
// @route POST /api/admin/inventory/stock-in
exports.stockIn = async (req, res, next) => {
  try {
    const { productId, qty, note } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.stockQty += qty;
    await product.save();

    await InventoryLog.create({
      productId,
      qtyChange: qty,
      type: 'stock_in',
      note,
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc  Remove/adjust stock manually
// @route POST /api/admin/inventory/stock-out
exports.stockOut = async (req, res, next) => {
  try {
    const { productId, qty, note } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.stockQty = Math.max(0, product.stockQty - qty);
    await product.save();

    await InventoryLog.create({
      productId,
      qtyChange: -qty,
      type: 'stock_out',
      note,
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc  Get low-stock products (threshold based)
// @route GET /api/admin/inventory/low-stock
exports.getLowStock = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await Product.findAll({
      where: { stockQty: { [Op.lte]: threshold } },
    });
    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// @desc  Get inventory logs for a product
// @route GET /api/admin/inventory/logs/:productId
exports.getInventoryLogs = async (req, res, next) => {
  try {
    const logs = await InventoryLog.findAll({
      where: { productId: req.params.productId },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all orders (admin view, with filters)
// @route GET /api/admin/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const orders = await Order.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc  Assign a delivery partner to an order
// @route PUT /api/admin/orders/:id/assign
exports.assignDeliveryPartner = async (req, res, next) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const partner = await User.findOne({ where: { id: deliveryPartnerId, role: 'delivery_partner' } });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    order.assignedTo = deliveryPartnerId;
    order.status = order.status === 'placed' ? 'confirmed' : order.status;
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc  List all delivery partners
// @route GET /api/admin/delivery-partners
exports.getDeliveryPartners = async (req, res, next) => {
  try {
    const partners = await User.findAll({
      where: { role: 'delivery_partner' },
      attributes: { exclude: ['password'] },
    });
    res.status(200).json({ success: true, partners });
  } catch (error) {
    next(error);
  }
};

// @desc  Get dashboard summary stats
// @route GET /api/admin/dashboard-stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'placed' } });
    const totalUsers = await User.count({ where: { role: 'customer' } });
    const totalRevenue = await Order.sum('totalAmount', { where: { paymentStatus: 'paid' } });

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        totalUsers,
        totalRevenue: totalRevenue || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
