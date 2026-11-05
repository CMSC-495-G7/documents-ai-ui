import { apiRequest } from '../../../common/api/http-client.ts';
import type { Tokens } from '../../../common/api/token-storage.ts';

export type SignInRequest = {
  email: string;
  password: string;
};

export function signIn(request: SignInRequest) {
  return apiRequest<Tokens>('/api/auth/login', {
    method: 'POST',
    body: request,
    auth: false,
  });
}
