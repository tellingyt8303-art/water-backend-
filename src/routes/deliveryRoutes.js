const express = require('express');
const router = express.Router();
const {
  getMyAssignedOrders,
  markDispatched,
  markDelivered,
  getMyEarnings,
} = require('../controllers/deliveryController');
const { protect } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

// All routes here are for logged-in delivery partners only
router.use(protect, authorizeRoles('delivery_partner'));

router.get('/my-orders', getMyAssignedOrders);
router.put('/orders/:id/dispatch', markDispatched);
router.put('/orders/:id/deliver', markDelivered);
router.get('/earnings', getMyEarnings);

module.exports = router;
