export var authEventCategory = 'AUTH';

export const REQUEST_PENDING  = 'REQUEST_PENDING';
export const REQUEST_RESOLVED = 'REQUEST_RESOLVED';
export const REQUEST_REJECTED = 'REQUEST_REJECTED';
export const CLEAR_AUTH_ERROR = 'CLEAR_AUTH_ERROR';
export const SET_THEME_MODE  = 'SET_THEME_MODE';

export const sessionLogin = () => ({
  type: `${authEventCategory}/${REQUEST_PENDING}`,
});

export const sessionLoginSuccess = (user: any) => ({
  type: `${authEventCategory}/${REQUEST_RESOLVED}`,
  data: user,
});

export const sessionLoginFail = (errorMessage: string) => ({
  type: `${authEventCategory}/${REQUEST_REJECTED}`,
  message: errorMessage,
});

export const sessionLogout = () => ({
  type: `${authEventCategory}/LOG_OUT`,
});

export const receiveUserData = (user: any) => ({
  type: `${authEventCategory}/RECEIVE_USER_DATA`,
  data: user,
});

export const clearAuthError = () => ({
  type: `${authEventCategory}/${CLEAR_AUTH_ERROR}`,
});

export const setThemeMode = (mode: 'light' | 'dark' | 'system') => ({
  type: `${authEventCategory}/${SET_THEME_MODE}`,
  mode,
});
