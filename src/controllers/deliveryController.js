const { Op } = require('sequelize');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Address = require('../models/Address');
const User = require('../models/User');

// @desc  Get orders assigned to the logged-in delivery partner
// @route GET /api/delivery/my-orders?status=dispatched
exports.getMyAssignedOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { assignedTo: req.user.id };
    if (status) where.status = status;

    const orders = await Order.findAll({
      where,
      include: [
        { model: Address },
        { model: User, attributes: ['name', 'phone'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark an assigned order as dispatched (picked up for delivery)
// @route PUT /api/delivery/orders/:id/dispatch
exports.markDispatched = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, assignedTo: req.user.id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
    }
    order.status = 'dispatched';
    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark an assigned order as delivered (and COD collected if applicable)
// @route PUT /api/delivery/orders/:id/deliver
exports.markDelivered = async (req, res, next) => {
  try {
    const { codCollected } = req.body;
    const order = await Order.findOne({ where: { id: req.params.id, assignedTo: req.user.id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
    }

    order.status = 'delivered';
    if (order.paymentType === 'cod' && codCollected) {
      order.paymentStatus = 'paid';
      const payment = await Payment.findOne({ where: { orderId: order.id } });
      if (payment) {
        payment.status = 'success';
        await payment.save();
      }
    }
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc  Get today's + overall earnings summary for the logged-in partner
// @route GET /api/delivery/earnings
exports.getMyEarnings = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const deliveredToday = await Order.findAll({
      where: { assignedTo: req.user.id, status: 'delivered', updatedAt: { [Op.gte]: startOfToday } },
    });
    const deliveredTotal = await Order.count({
      where: { assignedTo: req.user.id, status: 'delivered' },
    });
    const pendingCount = await Order.count({
      where: { assignedTo: req.user.id, status: { [Op.in]: ['confirmed', 'dispatched'] } },
    });

    // Simple flat per-delivery earning model — adjust to your payout structure
    const PER_DELIVERY_RATE = 25;

    res.status(200).json({
      success: true,
      earnings: {
        deliveriesToday: deliveredToday.length,
        earningsToday: deliveredToday.length * PER_DELIVERY_RATE,
        deliveriesTotal: deliveredTotal,
        earningsTotal: deliveredTotal * PER_DELIVERY_RATE,
        pendingDeliveries: pendingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
