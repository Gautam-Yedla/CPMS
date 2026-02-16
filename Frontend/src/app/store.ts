import axios from 'axios';
import {
  applyMiddleware,
  compose,
  legacy_createStore as createStore,
  Store,
} from 'redux';
import {
  Persistor,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { withExtraArgument } from 'redux-thunk';

import {
  IRootState,
  rootReducer,
} from '@app/appReducer';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const composeEnhancers = (
  import.meta.env.MODE === 'development'
  && window
  && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
) || compose;

const persistConfig = {
  key: 'root',
  storage,
  version: 1,
  blacklist: [], // Persist everything by default for now
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

function configureStore(initialState?: IRootState) {
  const middlewares = [
    withExtraArgument(axios),
  ];

  const enhancer = composeEnhancers(
    applyMiddleware(...middlewares)
  );

  return createStore(
    persistedReducer,
    initialState as any,
    enhancer
  );
}

const store: Store<IRootState> = configureStore();
const persistor: Persistor = persistStore(store);

export { persistor, store };
