import { Router } from 'express';
import { register } from './register.js';
import { login } from './login.js';
import { refresh } from './refresh.js';
import { logout } from './logout.js';
import { me } from './me.js';
import { authGuard } from '../../middleware/auth-guard.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authGuard, me);
