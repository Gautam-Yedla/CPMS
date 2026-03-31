import { 
  STUDENT_DASHBOARD_EVENT_CATEGORY, 
  FETCH_STUDENT_DATA_PENDING, 
  FETCH_STUDENT_DATA_SUCCESS, 
  FETCH_STUDENT_DATA_FAILURE 
} from './studentDashboardActions';

interface IStudentDashboardData {
  [key: string]: unknown;
}

interface IStudentDashboardAction {
  type: string;
  data?: IStudentDashboardData;
  error?: string;
}

export interface IStudentDashboardState {
  data: IStudentDashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: IStudentDashboardState = {
  data: null,
  loading: false,
  error: null,
};

export const studentDashboardReducer = (state = initialState, action: IStudentDashboardAction): IStudentDashboardState => {
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
        data: action.data || null,
      };
    case `${STUDENT_DASHBOARD_EVENT_CATEGORY}/${FETCH_STUDENT_DATA_FAILURE}`:
      return {
        ...state,
        loading: false,
        error: action.error || null,
      };
    default:
      return state;
  }
};
