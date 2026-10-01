'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e53935' },
    secondary: { main: '#00bcd4' },
    background: { default: '#0a0e1a', paper: '#111827' },
    divider: '#1e2d42',
    text: { primary: '#e2e8f0', secondary: '#64748b' },
  },
  typography: {
    fontFamily: ['Outfit', 'sans-serif'].join(','),
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          boxShadow: '0 4px 16px rgba(229,57,53,0.3)',
          '&:hover': { boxShadow: '0 6px 20px rgba(229,57,53,0.45)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': { borderColor: '#1e2d42' },
          '&:hover fieldset': { borderColor: '#2d4263' },
        },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
