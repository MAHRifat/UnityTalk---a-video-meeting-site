import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, TextField, Box, Typography } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { AuthContext } from '../Contexts/AuthContext';
import styled from '@emotion/styled';

// Styled components for consistent styling
const NavBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const MainContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 72px);
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

const JoinForm = styled.div`
  max-width: 500px;
  margin: 0 auto;
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
`;

const LogoImage = styled.img`
  max-width: 80%;
  max-height: 80%;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
`;

function JoiningPage() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [error, setError] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    const handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) {
            setError("Please enter a meeting code");
            return;
        }

        const cleanMeetingCode = meetingCode.trim().toLowerCase();

        try {
            // Try to save to history (but proceed even if it fails)
            try {
                await addToUserHistory(cleanMeetingCode);
            } catch (historyError) {
                console.warn("History save warning:", historyError);
            }

            // Always navigate to meeting
            navigate(`/${cleanMeetingCode}`);
        } catch (err) {
            console.error("Join Error:", err);
            setError(err.response?.data?.error || "Failed to join meeting");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJoinVideoCall();
        }
    };

    return (
        <>
            <NavBar>
                <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }}>
                    <Typography variant="h5" fontWeight="600"
                        onClick={() => navigate("/")}

                    >
                        UnityTalk
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton
                        onClick={() => navigate("/history")}
                        sx={{ color: 'white' }}
                        aria-label="history"
                    >
                        <RestoreIcon />
                        <Typography variant="body2" ml={1}>History</Typography>
                    </IconButton>

                    <Button
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }}
                        startIcon={<ExitToAppIcon />}
                        sx={{
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </NavBar>

            <MainContainer>
                <LeftPanel>
                    <JoinForm>
                        <Typography variant="h4" gutterBottom fontWeight="600">
                            Start or Join a Meeting
                        </Typography>
                        <Typography variant="body1" color="textSecondary" mb={4}>
                            Enter any code to create or join a video room
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

export default withAuth(JoiningPage);