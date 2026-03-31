import { createTheme } from '@mui/material/styles';
import { themeLight, themeDark } from './theme';

export const createAppTheme = (mode: 'light' | 'dark') => {
  const colors = mode === 'light' ? themeLight : themeDark;

  return createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    palette: {
      mode,
      primary: {
        main: colors.primary,
        contrastText: '#ffffff',
      },
      secondary: {
        main: colors.secondary,
      },
      error: {
        main: colors.error,
      },
      warning: {
        main: colors.warning,
      },
      info: {
        main: colors.info,
      },
      success: {
        main: colors.success,
      },
      background: {
        default: colors.background,
        paper: colors.paper,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
      },
      divider: colors.divider,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { 
        fontWeight: 700,
        fontSize: 'clamp(2rem, 5vw, 3rem)',
      },
      h2: { 
        fontWeight: 700,
        fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
      },
      h3: { 
        fontWeight: 700,
        fontSize: 'clamp(1.25rem, 3vw, 1.875rem)',
      },
      h4: { 
        fontWeight: 600,
        fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
      },
      h5: { 
        fontWeight: 600,
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
      },
      h6: { 
        fontWeight: 600,
        fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)',
      },
      body1: {
        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      },
      body2: {
        fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
      },
      caption: {
        fontSize: 'clamp(0.6875rem, 1.2vw, 0.75rem)',
      },
      button: { 
        textTransform: 'none', 
        fontWeight: 600,
        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            boxShadow: 'none',
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: `${colors.primary}ee`,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
          },
        },
      },
    },
  });
};
