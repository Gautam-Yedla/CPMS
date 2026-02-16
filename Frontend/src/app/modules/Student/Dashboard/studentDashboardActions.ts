export const STUDENT_DASHBOARD_EVENT_CATEGORY = 'STUDENT_DASHBOARD';

export const FETCH_STUDENT_DATA_PENDING = 'FETCH_STUDENT_DATA_PENDING';
export const FETCH_STUDENT_DATA_SUCCESS = 'FETCH_STUDENT_DATA_SUCCESS';
export const FETCH_STUDENT_DATA_FAILURE = 'FETCH_STUDENT_DATA_FAILURE';

export const fetchStudentData = () => ({
  type: `${STUDENT_DASHBOARD_EVENT_CATEGORY}/${FETCH_STUDENT_DATA_PENDING}`,
});

export const fetchStudentDataSuccess = (data: any) => ({
  type: `${STUDENT_DASHBOARD_EVENT_CATEGORY}/${FETCH_STUDENT_DATA_SUCCESS}`,
  data,
});

export const fetchStudentDataFailure = (error: string) => ({
  type: `${STUDENT_DASHBOARD_EVENT_CATEGORY}/${FETCH_STUDENT_DATA_FAILURE}`,
  error,
});
