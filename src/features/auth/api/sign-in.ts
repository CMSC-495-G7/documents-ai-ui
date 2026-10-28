export type SignInRequest = {
  email: string
  password: string
}

// Placeholder until the API has a sign-in endpoint
export async function signIn(request: SignInRequest): Promise<void> {
  void request
}
