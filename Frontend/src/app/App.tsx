import { Provider as StoreProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '@app/store';
import { RouteNavigation } from './Routes/Routes';
import Providers from '@app/shared/enhancers/Providers';

const App = () => (
  <StoreProvider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Providers>
        <RouteNavigation />
      </Providers>
    </PersistGate>
  </StoreProvider>
);

export default App;
