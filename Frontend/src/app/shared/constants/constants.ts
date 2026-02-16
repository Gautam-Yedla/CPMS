export const APP_ERRORS = {
  PROFILE_NOT_FOUND: 'Your user profile could not be found. Please contact an administrator.',
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again later.',
  AUTH_SINGULAR_ERROR: 'Unable to retrieve user information. Please try again.',
};

export const SUPABASE_ERRORS = {
  PGRST116: APP_ERRORS.PROFILE_NOT_FOUND, // The code for "single() returned zero rows"
};
