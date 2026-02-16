export type TThemeColor = 
  | 'primary'
  | 'secondary'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'white'
  | 'black'
  | 'background'
  | 'paper'
  | 'textPrimary'
  | 'textSecondary'
  | 'divider';

export interface IThemeColors {
  primary: string;
  secondary: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  white: string;
  black: string;
  background: string;
  paper: string;
  textPrimary: string;
  textSecondary: string;
  divider: string;
}

export const themeLight: IThemeColors = {
  primary: '#6366f1', // Indigo
  secondary: '#10b981', // Emerald
  error: '#ef4444', // Red
  warning: '#f59e0b', // Amber
  info: '#3b82f6', // Blue
  success: '#22c55e', // Green
  white: '#ffffff',
  black: '#000000',
  background: '#f8fafc',
  paper: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  divider: '#e2e8f0',
};

export const themeDark: IThemeColors = {
  primary: '#818cf8', // Lighter Indigo
  secondary: '#34d399', // Lighter Emerald
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  success: '#4ade80',
  white: '#ffffff',
  black: '#000000',
  background: '#0f172a', // Slate 900
  paper: '#1e293b', // Slate 800
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  divider: '#334155',
};
