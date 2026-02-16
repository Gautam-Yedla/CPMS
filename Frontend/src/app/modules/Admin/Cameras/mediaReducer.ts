export const MEDIA_EVENT_CATEGORY = 'MEDIA';

export const SET_FILE_STATUS = `${MEDIA_EVENT_CATEGORY}/SET_FILE_STATUS`;
export const MERGE_FILE_STATUSES = `${MEDIA_EVENT_CATEGORY}/MERGE_FILE_STATUSES`;
export const CLEAR_STATUSES = `${MEDIA_EVENT_CATEGORY}/CLEAR_STATUSES`;
export const SET_HISTORY = `${MEDIA_EVENT_CATEGORY}/SET_HISTORY`;
export const ADD_HISTORY_ITEM = `${MEDIA_EVENT_CATEGORY}/ADD_HISTORY_ITEM`;

export interface IMediaState {
  fileStatuses: Record<string, 'pending' | 'processing' | 'done' | 'error'>;
  recentUploads: any[];
}

const initialState: IMediaState = {
  fileStatuses: {},
  recentUploads: [],
};

export const mediaReducer = (state = initialState, action: any): IMediaState => {
  switch (action.type) {
    case SET_FILE_STATUS:
      return {
        ...state,
        fileStatuses: {
          ...state.fileStatuses,
          [action.name]: action.status,
        },
      };
    case MERGE_FILE_STATUSES:
      return {
        ...state,
        fileStatuses: {
          ...state.fileStatuses,
          ...action.statuses,
        },
      };
    case CLEAR_STATUSES:
      return {
        ...state,
        fileStatuses: {},
      };
    case SET_HISTORY:
      return {
        ...state,
        recentUploads: action.history,
      };
    case ADD_HISTORY_ITEM:
      // Avoid duplicates
      if (state.recentUploads.some(item => item.id === action.item.id)) {
        return state;
      }
      return {
        ...state,
        recentUploads: [action.item, ...state.recentUploads],
      };
    default:
      return state;
  }
};
