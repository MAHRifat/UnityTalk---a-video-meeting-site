import React, { useContext, useState } from 'react';
import {
  Avatar,
  Button,
  TextField,
  Link,
  Box,
  Typography,
  Snackbar,
  CssBaseline,
  Container,
  InputAdornment,
  IconButton,
  AppBar,
  Toolbar,
  useMediaQuery,
  Menu,
  MenuItem
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Visibility, VisibilityOff, Menu as MenuIcon } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../Contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50', // greenish color
    },
  },
});

export default function Authentication() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState(0); // 0 for login, 1 for register
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const isSmallScreen = useMediaQuery('(max-width:600px)');

  const { handleRegister, handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    if (formState === 1 && !name) {
      setError("Name is required for registration");
      return;
    }

    setLoading(true);
    try {
      if (formState === 0) {
        await handleLogin(username, password);
        setMessage("Login successful!");
        setOpenSnackbar(true);
        navigate('/join');
      }
      if (formState === 1) {
        await handleRegister(name, username, password);
        setMessage("Registration successful! Please login");
        setOpenSnackbar(true);
        setName('');
        setFormState(0);
      }
    } catch (e) {
      let message = (e.response?.data?.message || "Something went wrong");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleJoinGuest = () => {
    navigate('/join-as-guest');
    handleMenuClose();
  };

  return (
    <ThemeProvider theme={theme}>
      {/* <CssBaseline /> */}

      {/* Navbar */}
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #11cd75 0%, #0fb367 100%)',
          color: 'white',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {isSmallScreen ? (
            <>
              <Typography
                onClick={() => navigate("/")}
                variant="h6" component="div" sx={{ mx: 'auto', fontWeight: 600, cursor: 'pointer' }}>
                UnityTalk
              </Typography>
              <IconButton color="inherit" onClick={handleMenuClick}>
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleJoinGuest}>Join as Guest</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Typography
                onClick={() => navigate("/")}
                variant="h6"
                component="div"
                sx={{ fontWeight: 600, letterSpacing: '1px', cursor: 'pointer' }}
              >
                UnityTalk
              </Typography>
              <Button
                onClick={handleJoinGuest}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  color: "white",
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #11cd75 0%, #0fb367 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0fb367 0%, #0da15e 100%)',
                  }
                }}
              >
                Join as Guest
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>


      {/* Form Body */}
      <Box
        sx={{
          height: 'calc(100vh - 64px)', // subtract AppBar height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Container maxWidth="xs">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 4,
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: 3,
              width: '100%',
              maxWidth: '400px'
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
              {formState === 0 ? 'Sign In' : 'Sign Up'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant={formState === 0 ? "contained" : "outlined"}
                onClick={() => setFormState(0)}
                sx={{ flex: 1 }}
              >
                Sign In
              </Button>
              <Button
                variant={formState === 1 ? "contained" : "outlined"}
                onClick={() => setFormState(1)}
                sx={{ flex: 1 }}
              >
                Sign Up
              </Button>
            </Box>

            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
              {formState === 1 && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Full Name"
                  name="fullname"
                  autoComplete="name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                label="Username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}

              <Button
                type='submit'
                fullWidth
                variant="contained"
                sx={{ mt: 1, mb: 2, py: 1.5 }}
                onClick={handleAuth}
                disabled={loading}
              >
                {loading ? 'Processing...' : formState === 0 ? "Sign In" : "Sign Up"}
              </Button>

              {!isSmallScreen && (
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                  onClick={handleJoinGuest}
                >
                  Join as Guest
                </Button>
              )}

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={message}
      />
    </ThemeProvider>
  );
}
