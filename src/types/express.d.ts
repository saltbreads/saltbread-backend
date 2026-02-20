/* eslint-disable @typescript-eslint/no-empty-object-type */
import 'express';
import type { AuthPrincipal } from 'src/modules/auth/types/auth-pricncipal';

declare global {
  namespace Express {
    interface User extends AuthPrincipal {}
  }
}
