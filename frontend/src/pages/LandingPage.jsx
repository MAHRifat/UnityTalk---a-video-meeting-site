import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Stack,
  Paper,
  createTheme,
  ThemeProvider,
  useMediaQuery
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Login as LoginIcon,
  Menu as MenuIcon,
  Group as GroupIcon,
  ScreenShare as ScreenShareIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// Create a default theme
const defaultTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#11cd75',
      light: '#e8f5e9',
    },
    secondary: {
      main: '#00b4db',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
});

function LandingPage() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar>
          {isMobile ? (
            <>
              <Typography
                onClick={() => navigate("/")}
                variant="h6"
                component="div"
                sx={{
                  flexGrow: 1,
                  fontWeight: 700,
                  textAlign: 'center',
                  color: '#121212',
                  cursor: "pointer"
                }}
              >
                UnityTalk
              </Typography>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenu}
                sx={{ color: '#121212' }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem
                  component={Link}
                  to="/join-as-guest"
                  onClick={handleClose}
                >
                  <VideoCallIcon sx={{ mr: 1 }} /> Join as Guest
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/auth"
                  onClick={handleClose}
                >
                  <LoginIcon sx={{ mr: 1 }} /> Login
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Typography
                onClick={() => navigate("/")}
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: '#121212',
                  cursor: 'pointer'
                }}
              >
                UnityTalk
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="text"
                  startIcon={<VideoCallIcon />}
                  component={Link}
                  to="/join-as-guest"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    color: '#121212'
                  }}
                >
                  Join as Guest
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LoginIcon />}
                  component={Link}
                  to="/auth"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    background: '#11cd75',
                    '&:hover': {
                      background: '#0fb367',
                    }
                  }}
                >
                  Login
                </Button>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#f5f7fa',
      }}>
        <Container 
          maxWidth="lg" 
          sx={{ 
            py: 8,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Grid 
            container 
            spacing={6}
            sx={{
              width: '100%',
              margin: '0 auto',
            }}
          >
            <Grid item xs={12} md={6}>
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: 3,
                  color: '#121212',
                  textAlign: isMobile ? 'center' : 'left'
                }}
              >
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(90deg, #11cd75, #00b4db)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Premium
                </Box>{' '}
                video meetings for everyone
              </Typography>

              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                component="p"
                sx={{
                  mb: 4,
                  maxWidth: '90%',
                  color: '#616161',
                  textAlign: isMobile ? 'center' : 'left'
                }}
              >
                Secure, high-quality video calls with screen sharing, real-time collaboration, and end-to-end encryption.
              </Typography>

              <Box sx={{
                display: 'flex',
                justifyContent: isMobile ? 'center' : 'flex-start',
                mb: 6
              }}>
                <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ width: isMobile ? '100%' : 'auto' }}>
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/auth"
                    startIcon={<LoginIcon />}
                    sx={{
                      borderRadius: '50px',
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      background: '#11cd75',
                      '&:hover': {
                        background: '#0fb367',
                      },
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    Get Started
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    component={Link}
                    to="/join-as-guest"
                    startIcon={<VideoCallIcon />}
                    sx={{
                      borderRadius: '50px',
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      borderColor: '#11cd75',
                      color: '#11cd75',
                      '&:hover': {
                        borderColor: '#0fb367',
                        backgroundColor: 'rgba(15, 179, 103, 0.04)',
                      },
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    Join Meeting
                  </Button>
                </Stack>
              </Box>

              <Grid container spacing={3}>
                {[
                  {
                    icon: <GroupIcon color="primary" sx={{ fontSize: 40 }} />,
                    title: "Group Meetings",
                    description: "Host meetings with up to 100 participants"
                  },
                  {
                    icon: <ScreenShareIcon color="primary" sx={{ fontSize: 40 }} />,
                    title: "Screen Sharing",
                    description: "Share your screen with participants"
                  },
                  {
                    icon: <SecurityIcon color="primary" sx={{ fontSize: 40 }} />,
                    title: "Secure Calls",
                    description: "End-to-end encrypted communications"
                  }
                ].map((feature, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper elevation={3} sx={{
                      padding: 3,
                      height: '100%',
                      borderRadius: '16px',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0px 10px 20px rgba(0,0,0,0.1)',
                      },
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Avatar sx={{
                          bgcolor: '#e8f5e9',
                          width: 60,
                          height: 60,
                          mb: 2
                        }}>
                          {feature.icon}
                        </Avatar>
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{
                        fontWeight: 600,
                        color: '#121212',
                        textAlign: 'center'
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{
                        color: '#616161',
                        textAlign: 'center'
                      }}>
                        {feature.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12} md={6} sx={{
              display: isMobile ? 'none' : 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px'
            }}>
              <Box sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Box sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  bgcolor: '#e8f5e9',
                  opacity: 0.2,
                  transform: 'rotate(-5deg)'
                }} />
                <Box sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  bgcolor: '#e1f5fe',
                  opacity: 0.2,
                  transform: 'rotate(5deg)'
                }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default LandingPage;