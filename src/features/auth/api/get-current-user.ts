import { apiRequest } from '../../../common/api/http-client.ts';
import type { User } from '../types.ts';

export function getCurrentUser() {
  return apiRequest<User>('/api/auth/me');
}
