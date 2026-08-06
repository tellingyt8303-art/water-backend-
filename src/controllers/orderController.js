const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Address = require('../models/Address');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc  Place a new order (COD or Online)
// @route POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { addressId, items, paymentType } = req.body;
    const userId = req.user.id;

    // Calculate total & validate stock
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product || product.stockQty < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product ? product.name : 'product'}`,
        });
      }
      totalAmount += product.price * item.qty;
      item.name = product.name;
      item.price = product.price;
    }

    const order = await Order.create({
      userId,
      addressId,
      items,
      totalAmount,
      paymentType,
      paymentStatus: paymentType === 'cod' ? 'pending' : 'pending',
      status: 'placed',
    });

    // Reduce stock + log inventory
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      product.stockQty -= item.qty;
      await product.save();

      await InventoryLog.create({
        productId: item.productId,
        qtyChange: -item.qty,
        type: 'order',
        note: `Order ${order.id}`,
      });
    }

    // If online payment, create Razorpay order
    if (paymentType === 'online') {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // amount in paise
        currency: 'INR',
        receipt: order.id,
      });

      await Payment.create({
        orderId: order.id,
        method: 'razorpay',
        amount: totalAmount,
        status: 'pending',
        razorpayOrderId: razorpayOrder.id,
      });

      return res.status(201).json({
        success: true,
        order,
        razorpayOrder,
      });
    }

    // COD order
    await Payment.create({
      orderId: order.id,
      method: 'cod',
      amount: totalAmount,
      status: 'pending',
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc  Verify Razorpay payment after checkout
// @route POST /api/orders/verify-payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const payment = await Payment.findOne({ where: { orderId } });
    payment.status = 'success';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    const order = await Order.findByPk(orderId);
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    await order.save();

    res.status(200).json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get logged-in user's orders
// @route GET /api/orders/my-orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        { model: User, as: 'deliveryPartner', attributes: ['name', 'phone'] },
        { model: Address },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single order
// @route GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'deliveryPartner', attributes: ['name', 'phone'] },
        { model: Address },
      ],
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc  Update order status (admin/delivery partner)
// @route PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus; // used to mark COD as paid

    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
