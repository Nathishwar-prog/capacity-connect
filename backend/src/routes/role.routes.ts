import { Router } from 'express';
import { roleCompetencyService } from '../services/role-competency.service';
import { asyncHandler } from '../errors/async.handler';
import { ResponseHelper } from '../errors/response.helper';

const router = Router();

// Public or Authenticated Role Catalogue
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const roles = await roleCompetencyService.getRoles();
    return ResponseHelper.success({
      res,
      message: 'Organizational roles retrieved successfully',
      data: roles,
    });
  }),
);

router.get(
  '/:roleId',
  asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const role = await roleCompetencyService.getRoleById(roleId);
    return ResponseHelper.success({
      res,
      message: 'Role details retrieved successfully',
      data: role,
    });
  }),
);

router.get(
  '/:roleId/competencies',
  asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const competencies = await roleCompetencyService.getRoleCompetencies(roleId);
    return ResponseHelper.success({
      res,
      message: 'Role competencies retrieved successfully',
      data: competencies,
    });
  }),
);

export default router;
