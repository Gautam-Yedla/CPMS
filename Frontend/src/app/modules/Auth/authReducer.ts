import {
  authEventCategory,
  REQUEST_PENDING,
  REQUEST_REJECTED,
  REQUEST_RESOLVED,
  CLEAR_AUTH_ERROR,
  SET_THEME_MODE,
} from './authActions';

export interface IPermission {
  name: string;
  [key: string]: unknown;
}

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
  permissions?: IPermission[];
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

interface IAuthAction {
  type: string;
  data?: IUserState;
  message?: string;
  mode?: 'light' | 'dark' | 'system';
}

export const authReducer = (state = initialState, action: IAuthAction): IAuthState => {
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
        user: action.data || null,
      };
    case `${authEventCategory}/${REQUEST_REJECTED}`:
      return {
        ...state,
        loading: false,
        isLoggedIn: false,
        error: action.message || null,
      };
    case `${authEventCategory}/${CLEAR_AUTH_ERROR}`:
      return {
        ...state,
        error: null,
      };
    case `${authEventCategory}/RECEIVE_USER_DATA`:
      return {
        ...state,
        user: action.data || null,
      };
    case `${authEventCategory}/${SET_THEME_MODE}`:
      return {
        ...state,
        theme: action.mode || 'light',
      };
    case `${authEventCategory}/LOG_OUT`:
      return initialState;
    default:
      return state;
  }
};
