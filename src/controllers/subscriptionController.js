const Subscription = require('../models/Subscription');
const Product = require('../models/Product');

// @desc  Create new subscription plan
// @route POST /api/subscriptions
exports.createSubscription = async (req, res, next) => {
  try {
    const { productId, frequency, quantityPerDelivery } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Calculate next delivery date based on frequency
    const nextDeliveryDate = new Date();
    if (frequency === 'daily') nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
    if (frequency === 'weekly') nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
    if (frequency === 'monthly') nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);

    const subscription = await Subscription.create({
      userId: req.user.id,
      productId,
      frequency,
      quantityPerDelivery,
      nextDeliveryDate,
      status: 'active',
    });

    res.status(201).json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
};

// @desc  Get logged-in user's subscriptions
// @route GET /api/subscriptions/my-subscriptions
exports.getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { userId: req.user.id },
    });
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    next(error);
  }
};

// @desc  Pause subscription
// @route PUT /api/subscriptions/:id/pause
exports.pauseSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    subscription.status = 'paused';
    await subscription.save();
    res.status(200).json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
};

// @desc  Resume subscription
// @route PUT /api/subscriptions/:id/resume
exports.resumeSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    subscription.status = 'active';
    await subscription.save();
    res.status(200).json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
};

// @desc  Cancel subscription
// @route DELETE /api/subscriptions/:id
exports.cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    subscription.status = 'cancelled';
    await subscription.save();
    res.status(200).json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    next(error);
  }
};
