import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    IconButton,
    TextField,
    Box,
    Typography,
    AppBar,
    Toolbar
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import styled from '@emotion/styled';

// Styled components (same as JoiningPage)
const MainContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 64px);
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
  background: #f8f9fa;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #11cd75 0%, #0fb367 100%);
  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

const LogoImage = styled.img`
  max-width: 80%;
  max-height: 80%;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
`;

const JoinForm = styled.div`
  max-width: 500px;
  margin: 0 auto;
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
`;

function JoinAsGuest() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [error, setError] = useState("");

    const handleJoinVideoCall = () => {
        if (!meetingCode.trim()) {
            setError("Please enter a meeting code");
            return;
        }

        const cleanMeetingCode = meetingCode
            .replace(/[^\w-]/g, '')
            .toLowerCase()
            .substring(0, 20);

        navigate(`/${cleanMeetingCode}`);
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJoinVideoCall();
        }
    }

    return (
        <>
            <AppBar
                position="static"
                sx={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)',
                    color: 'white',
                }}
            >
                <Toolbar>
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 600,
                            letterSpacing: '1px',
                            cursor: "pointer"
                        }}
                        onClick={() => navigate("/")}
                    >
                        UnityTalk
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<LoginIcon />}
                        onClick={() => navigate("/auth")}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #11cd75 0%, #0fb367 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #0fb367 0%, #0da15e 100%)',
                            }
                        }}
                    >
                        Login
                    </Button>
                </Toolbar>
            </AppBar>

            <MainContainer>
                <LeftPanel>
                    <JoinForm>
                        <Typography variant="h4" gutterBottom fontWeight="600">
                            Join as Guest
                        </Typography>
                        <Typography variant="body1" color="textSecondary" mb={4}>
                            Enter a meeting code to join the video room
                        </Typography>

                        <Box display="flex" gap={2} alignItems="flex-end">
                            <TextField
                                fullWidth
                                label="Meeting Code"
                                variant="outlined"
                                value={meetingCode}
                                onChange={(e) => {
                                    setMeetingCode(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={handleKeyPress}
                                error={!!error}
                                helperText={error || "e.g. team-meeting-123"}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#11cd75',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#0fb367',
                                        },
                                    },
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleJoinVideoCall}
                                sx={{
                                    padding: '12px 24px',
                                    backgroundColor: '#11cd75',
                                    '&:hover': {
                                        backgroundColor: '#0fb367',
                                    },
                                }}
                            >
                                Join
                            </Button>
                        </Box>
                    </JoinForm>
                </LeftPanel>

                <RightPanel>
                    <LogoImage src="/back.jpg" alt="Video Call Illustration" />
                </RightPanel>
            </MainContainer>
        </>
    );
}

export default JoinAsGuest;