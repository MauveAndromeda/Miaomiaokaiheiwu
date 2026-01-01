/**
 * 教练相关路由
 */

import { Router } from 'express';
import { query, param } from 'express-validator';
import { CoachController } from '../controllers/coach';
import { auth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
const coachController = new CoachController();

/**
 * @route   GET /api/v1/coaches
 * @desc    获取教练列表
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('gameId').optional().isUUID(),
    query('serviceType').optional().isIn(['play', 'voice', 'video']),
    query('gender').optional().isIn(['male', 'female']),
    query('sort').optional().isIn(['popular', 'rating', 'price_asc', 'price_desc', 'newest']),
    query('minPrice').optional().isInt({ min: 0 }),
    query('maxPrice').optional().isInt({ min: 0 }),
  ],
  validate,
  optionalAuth,
  coachController.getList
);

/**
 * @route   GET /api/v1/coaches/hot
 * @desc    获取热门教练
 * @access  Public
 */
router.get('/hot', optionalAuth, coachController.getHotCoaches);

/**
 * @route   GET /api/v1/coaches/recommended
 * @desc    获取推荐教练
 * @access  Public
 */
router.get('/recommended', optionalAuth, coachController.getRecommended);

/**
 * @route   GET /api/v1/coaches/:id
 * @desc    获取教练详情
 * @access  Public
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  optionalAuth,
  coachController.getDetail
);

/**
 * @route   GET /api/v1/coaches/:id/reviews
 * @desc    获取教练评价
 * @access  Public
 */
router.get(
  '/:id/reviews',
  [
    param('id').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  coachController.getReviews
);

/**
 * @route   GET /api/v1/coaches/:id/availability
 * @desc    获取教练可预约时间
 * @access  Public
 */
router.get(
  '/:id/availability',
  [param('id').isUUID()],
  validate,
  coachController.getAvailability
);

export default router;
