const express = require('express');
const router = express.Router();
const {
  createSubscription,
  getMySubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createSubscription);
router.get('/my-subscriptions', protect, getMySubscriptions);
router.put('/:id/pause', protect, pauseSubscription);
router.put('/:id/resume', protect, resumeSubscription);
router.delete('/:id', protect, cancelSubscription);

module.exports = router;
