import { 
  STUDENT_DASHBOARD_EVENT_CATEGORY, 
  FETCH_STUDENT_DATA_PENDING, 
  FETCH_STUDENT_DATA_SUCCESS, 
  FETCH_STUDENT_DATA_FAILURE 
} from './studentDashboardActions';

export interface IStudentDashboardState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: IStudentDashboardState = {
  data: null,
  loading: false,
  error: null,
};

export const studentDashboardReducer = (state = initialState, action: any): IStudentDashboardState => {
  switch (action.type) {
    case `${STUDENT_DASHBOARD_EVENT_CATEGORY}/${FETCH_STUDENT_DATA_PENDING}`:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case `${STUDENT_DASHBOARD_EVENT_CATEGORY}/${FETCH_STUDENT_DATA_SUCCESS}`:
      return {
        ...state,
        loading: false,
        data: action.data,
      };
    case `${STUDENT_DASHBOARD_EVENT_CATEGORY}/${FETCH_STUDENT_DATA_FAILURE}`:
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    default:
      return state;
  }
};
