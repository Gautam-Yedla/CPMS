import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { IRootState } from '@app/appReducer';
import { createAppTheme } from '@/styles/muiTheme';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const { theme: themeMode } = useSelector((state: IRootState) => state.app.auth);
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  
  const theme = useMemo(() => {
    let mode: 'light' | 'dark' = 'light';
    if (themeMode === 'system') {
      mode = systemPrefersDark ? 'dark' : 'light';
    } else {
      mode = themeMode as 'light' | 'dark';
    }
    return createAppTheme(mode);
  }, [themeMode, systemPrefersDark]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default Providers;
