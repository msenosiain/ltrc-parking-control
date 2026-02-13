import {Role} from '../auth/roles.enum';

export interface User {
  googleId: string;
  email: string;
  name: string;
  lastName: string;
  roles: Role[];
}
