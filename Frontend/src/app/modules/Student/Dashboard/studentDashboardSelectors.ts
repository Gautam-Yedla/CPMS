import { createSelector } from 'reselect';
import { IRootState } from '@app/appReducer';

export const studentDashboardState = (state: IRootState) => state.app.studentDashboard;

export const studentDataSelector = createSelector(
  studentDashboardState,
  (state) => state.data
);

export const studentDashboardLoadingSelector = createSelector(
  studentDashboardState,
  (state) => state.loading
);
