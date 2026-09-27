import { Router } from 'express';
import { ClientService } from '../services/client.service';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { createClientSchema, updateClientSchema } from '../validators/client.validator';
import { sendSuccess } from '../utils/response';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), async (_req, res, next) => {
  try {
    const clients = await ClientService.getAllClients();
    return sendSuccess(res, clients);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res, next) => {
  try {
    const client = await ClientService.getClientById(req.params.id);
    return sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(createClientSchema), async (req, res, next) => {
  try {
    const client = await ClientService.createClient(req.body);
    return sendSuccess(res, client, 201, 'Client created');
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole(Role.ADMIN), validate(updateClientSchema), async (req, res, next) => {
  try {
    const client = await ClientService.updateClient(req.params.id, req.body);
    return sendSuccess(res, client);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const result = await ClientService.deleteClient(req.params.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
