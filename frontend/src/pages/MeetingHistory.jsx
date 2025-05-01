import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    IconButton,
    Typography,
    CircularProgress,
    Box,
    Card,
    CardContent,
    CardActions,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Tooltip
} from '@mui/material';
import { ExitToApp, ArrowBack, ContentCopy, History } from '@mui/icons-material';
import styled from '@emotion/styled';
import moment from 'moment';

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

const HistoryContainer = styled(Card)`
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
`;

function MeetingHistory() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserMeetings = async () => {
            try {
                const response = await getHistoryOfUser();

                if (response.success) {
                    setMeetings(response.meetings || []);
                } else {
                    throw new Error(response.error || 'Failed to load history');
                }
            } catch (err) {
                console.error("Meeting history error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserMeetings();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    const handleBack = () => {
        navigate(-1);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // You could add a snackbar/toast notification here
    };

    return (
        <>
            <NavBar>
                <Box display="flex" alignItems="center">
                    <IconButton
                        onClick={handleBack}
                        sx={{ color: 'white', mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" fontWeight="600">
                        Meeting History
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        onClick={handleLogout}
                        startIcon={<ExitToApp />}
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
                    <HistoryContainer>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={3}>
                                <History color="primary" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h4" component="h1">
                                    Your Meeting History
                                </Typography>
                            </Box>

                            {loading ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : error ? (
                                <Typography color="error" align="center" py={4}>
                                    {error}
                                </Typography>
                            ) : meetings.length === 0 ? (
                                <Typography align="center" py={4}>
                                    No meetings found in your history
                                </Typography>
                            ) : (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <List>
                                        {meetings.map(meeting => (
                                            <React.Fragment key={meeting._id}>
                                                <ListItem>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="h6" component="div" color='#11cd75'>
                                                                <strong>Meeting code: </strong> {meeting.meetingCode}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Typography variant="body2" color="text.secondary">
                                                                Joined: {moment(meeting.joinedAt).format('LLL')}
                                                            </Typography>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Tooltip title="Copy meeting code">
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() => copyToClipboard(meeting.meetingCode)}
                                                            >
                                                                <ContentCopy />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                                <Divider variant="inset" component="li" />
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </>
                            )}
                        </CardContent>
                    </HistoryContainer>
                </LeftPanel>

                <RightPanel>
                    <Box textAlign="center" color="white">
                        <Typography variant="h3" gutterBottom>
                            Your Meeting Journey
                        </Typography>
                        <Typography variant="body1">
                            All your video calls in one place.
                            Never lose track of important meetings again.
                        </Typography>
                        {/* You could add an illustration here */}
                    </Box>
                </RightPanel>
            </MainContainer>
        </>
    );
}

export default MeetingHistory;