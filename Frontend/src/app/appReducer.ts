import { combineReducers } from 'redux';
import { authReducer, IAuthState } from '@modules/Auth/authReducer';
import { studentDashboardReducer, IStudentDashboardState } from '@modules/Student/Dashboard/studentDashboardReducer';

import { mediaReducer, IMediaState } from '@modules/Admin/Cameras/mediaReducer';

export interface IAppReducers {
  auth: IAuthState;
  studentDashboard: IStudentDashboardState;
  media: IMediaState;
}

export interface IRootState {
  app: IAppReducers;
}

const subAppReducer = combineReducers({
  auth: authReducer,
  studentDashboard: studentDashboardReducer,
  media: mediaReducer,
});

const appReducer = combineReducers({
  app: subAppReducer,
});

export const authEventCategory = 'AUTH';

export const rootReducer = (
  state: any,
  action: any
): any => {
  if (action.type === `${authEventCategory}/LOG_OUT`) {
    state = undefined;
  }

  return appReducer(state, action);
};
