import { Router } from 'express';
import { AuthService } from '../services/auth.service';
export declare function securityRouter(authService: AuthService): Router;
