const express = require('express');
const router = express.Router();
const {
  stockIn,
  stockOut,
  getLowStock,
  getInventoryLogs,
  getAllOrders,
  getDashboardStats,
  assignDeliveryPartner,
  getDeliveryPartners,
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

// All admin routes protected + admin-only
router.use(protect, authorizeRoles('admin'));

router.post('/inventory/stock-in', stockIn);
router.post('/inventory/stock-out', stockOut);
router.get('/inventory/low-stock', getLowStock);
router.get('/inventory/logs/:productId', getInventoryLogs);
router.get('/orders', getAllOrders);
router.put('/orders/:id/assign', assignDeliveryPartner);
router.get('/delivery-partners', getDeliveryPartners);
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;
