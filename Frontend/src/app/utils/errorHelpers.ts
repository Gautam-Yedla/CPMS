import { SUPABASE_ERRORS, APP_ERRORS } from '@shared/constants/constants';

/**
 * Maps Supabase/Backend error objects to user-friendly strings.
 */
export const mapErrorMessage = (error: any): string => {
  if (!error) return '';

  // Handle Supabase PostgREST error codes
  if (error.code && SUPABASE_ERRORS[error.code as keyof typeof SUPABASE_ERRORS]) {
    return SUPABASE_ERRORS[error.code as keyof typeof SUPABASE_ERRORS];
  }

  // Handle specific technical messages often seen from Supabase-js
  if (error.message === 'Cannot coerce the result to a single JSON object') {
    return APP_ERRORS.PROFILE_NOT_FOUND;
  }

  if (error.message === 'Invalid login credentials') {
    return APP_ERRORS.INVALID_CREDENTIALS;
  }

  return error.message || APP_ERRORS.GENERIC_ERROR;
};
