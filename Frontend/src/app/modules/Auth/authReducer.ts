import {
  authEventCategory,
  REQUEST_PENDING,
  REQUEST_REJECTED,
  REQUEST_RESOLVED,
  CLEAR_AUTH_ERROR,
  SET_THEME_MODE,
} from './authActions';

export interface IUserState {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'faculty' | 'security' | 'admin' | 'guest';
  student_id?: string;
  department?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface IAuthState {
  isLoggedIn: boolean;
  error: string | null;
  user: IUserState | null;
  loading: boolean;
  theme: 'light' | 'dark' | 'system';
}

const initialState: IAuthState = {
  isLoggedIn: false,
  error: null,
  user: null,
  loading: false,
  theme: 'system',
};

export const authReducer = (state = initialState, action: any): IAuthState => {
  switch (action.type) {
    case `${authEventCategory}/${REQUEST_PENDING}`:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case `${authEventCategory}/${REQUEST_RESOLVED}`:
      return {
        ...state,
        isLoggedIn: true,
        loading: false,
        user: action.data,
      };
    case `${authEventCategory}/${REQUEST_REJECTED}`:
      return {
        ...state,
        loading: false,
        isLoggedIn: false,
        error: action.message,
      };
    case `${authEventCategory}/${CLEAR_AUTH_ERROR}`:
      return {
        ...state,
        error: null,
      };
    case `${authEventCategory}/RECEIVE_USER_DATA`:
      return {
        ...state,
        user: action.data,
      };
    case `${authEventCategory}/${SET_THEME_MODE}`:
      return {
        ...state,
        theme: action.mode,
      };
    case `${authEventCategory}/LOG_OUT`:
      return initialState;
    default:
      return state;
  }
};
