'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Hub } from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'Builder', href: '/builder' },
  { label: 'Demo', href: '/demo' },
  { label: 'Catalog', href: '/catalog' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(10,14,26,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
        <Hub sx={{ mr: 1.5, color: 'primary.main' }} />
        <Box sx={{ mr: 6 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1}>
            Agent Builder
          </Typography>
          <Typography
            className="mono"
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.15em' }}
          >
            DATABRICKS
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {NAV.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Button
                key={href}
                component={Link}
                href={href}
                disableRipple
                sx={{
                  color: active ? 'text.primary' : 'text.secondary',
                  fontWeight: active ? 700 : 500,
                  position: 'relative',
                  px: 1.5,
                  '&:hover': { color: 'text.primary', bgcolor: 'transparent' },
                  '&::after': active
                    ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 2,
                        left: '20%',
                        width: '60%',
                        height: 2,
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                      }
                    : {},
                }}
              >
                {label}
              </Button>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
