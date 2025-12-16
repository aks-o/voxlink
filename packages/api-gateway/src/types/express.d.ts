import { Request } from 'express';
import { User } from '@voxlink/shared';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export { };
