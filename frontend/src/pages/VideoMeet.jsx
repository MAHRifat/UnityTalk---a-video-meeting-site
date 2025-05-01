import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, IconButton, Badge, useMediaQuery } from '@mui/material';
import {
    Videocam as VideocamIcon, VideocamOff as VideocamOffIcon,
    Mic as MicIcon, MicOff as MicOffIcon,
    ScreenShare as ScreenShareIcon, StopScreenShare as StopScreenShareIcon,
    Chat as ChatIcon, CallEnd as CallEndIcon
} from '@mui/icons-material';
import io from 'socket.io-client';
import './VideoMeet.css';

const server_url = "https://unitytalk-backend.onrender.com";
const peerConfigConnections = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const VideoMeet = () => {
    const [askForUserName, setAskForUserName] = useState(true);
    const [username, setUsername] = useState('');
    const [videos, setVideos] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState(0);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [screen, setScreen] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [mainVideo, setMainVideo] = useState(null);

    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(max-width:960px)');

    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoRef = useRef();
    const videoRef = useRef([]);
    const connections = useRef({});
    const messagesEndRef = useRef(null);
    const messageCounterRef = useRef(0); // New ref to track message counts

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            replaceStream(stream);
            connectToSocketServer();
        } catch (e) {
            console.error('Error getting user media:', e);
        }
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url);

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit('join-call', window.location.href);
        });

        socketRef.current.on('signal', gotMessageFromServer);
        
        socketRef.current.on('chat-message', (data) => {
            // Use ref to track the last message to prevent duplicates
            if (data.timestamp > messageCounterRef.current) {
                messageCounterRef.current = data.timestamp;
                setMessages(prev => {
                    const messageExists = prev.some(msg => 
                        msg.data === data.message && 
                        msg.sender === data.username && 
                        msg.timestamp === data.timestamp
                    );
                    
                    if (!messageExists) {
                        return [...prev, {
                            data: data.message,
                            sender: data.username,
                            timestamp: data.timestamp
                        }];
                    }
                    return prev;
                });

                if (!showChat && data.username !== username) {
                    setNewMessages(prev => prev + 1);
                }
            }
        });

        socketRef.current.on('user-left', (id) => {
            setVideos(prev => prev.filter(video => video.socketId !== id));
        });

        socketRef.current.on('user-joined', (id, clients) => {
            clients.forEach(socketListId => {
                if (!connections.current[socketListId]) {
                    const pc = new RTCPeerConnection(peerConfigConnections);
                    connections.current[socketListId] = pc;

                    pc.onicecandidate = event => {
                        if (event.candidate) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }));
                        }
                    };

                    pc.ontrack = event => {
                        const stream = event.streams[0];
                        setVideos(prev => {
                            const videoExists = prev.find(v => v.socketId === socketListId);
                            const updatedVideos = videoExists
                                ? prev.map(video => video.socketId === socketListId ? { ...video, stream } : video)
                                : [...prev, { socketId: socketListId, stream }];
                            return updatedVideos;
                        });
                    };

                    if (window.localStream) {
                        window.localStream.getTracks().forEach(track => {
                            pc.addTrack(track, window.localStream);
                        });
                    }
                }
            });

            if (id === socketIdRef.current) {
                Object.keys(connections.current).forEach(id2 => {
                    if (id2 === socketIdRef.current) return;
                    const pc = connections.current[id2];
                    pc.createOffer()
                        .then(offer => pc.setLocalDescription(offer))
                        .then(() => {
                            socketRef.current.emit('signal', id2, JSON.stringify({
                                sdp: pc.localDescription
                            }));
                        })
                        .catch(console.error);
                });
            }
        });
    };

    const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);
        if (fromId !== socketIdRef.current && connections.current[fromId]) {
            const pc = connections.current[fromId];
            if (signal.sdp) {
                pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {
                        if (signal.sdp.type === 'offer') {
                            return pc.createAnswer();
                        }
                    })
                    .then(answer => {
                        if (answer) {
                            return pc.setLocalDescription(answer);
                        }
                    })
                    .then(() => {
                        if (pc.localDescription) {
                            socketRef.current.emit('signal', fromId, JSON.stringify({
                                sdp: pc.localDescription
                            }));
                        }
                    })
                    .catch(console.error);
            } else if (signal.ice) {
                pc.addIceCandidate(new RTCIceCandidate(signal.ice))
                    .catch(console.error);
            }
        }
    };

    const getDisplayMedia = async () => {
        try {
            const wasAudioEnabled = audioEnabled;

            if (window.localStream) {
                window.localStream.getVideoTracks().forEach(track => track.stop());
            }

            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });

            const audioTrack = window.localStream?.getAudioTracks()[0];
            const newStream = new MediaStream();
            screenStream.getVideoTracks().forEach(track => newStream.addTrack(track));
            if (audioTrack) {
                newStream.addTrack(audioTrack);
                audioTrack.enabled = wasAudioEnabled;
            }

            screenStream.getVideoTracks()[0].onended = async () => {
                setScreen(false);
                try {
                    const camStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    camStream.getAudioTracks()[0].enabled = wasAudioEnabled;
                    replaceStream(camStream);
                } catch (e) {
                    console.error("Error switching back to camera:", e);
                }
            };

            replaceStream(newStream);
            setScreen(true);
        } catch (e) {
            console.error('Error getting display media:', e);
            setScreen(false);
        }
    };

    const replaceStream = (newStream) => {
        const wasAudioEnabled = audioEnabled;
        localVideoRef.current.srcObject = newStream;
        window.localStream = newStream;

        if (newStream.getAudioTracks().length > 0) {
            newStream.getAudioTracks()[0].enabled = wasAudioEnabled;
            setAudioEnabled(wasAudioEnabled);
        }

        Object.keys(connections.current).forEach(id => {
            if (id === socketIdRef.current) return;

            const pc = connections.current[id];
            const senders = pc.getSenders();

            const videoTrack = newStream.getVideoTracks()[0];
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender && videoTrack) {
                videoSender.replaceTrack(videoTrack)
                    .catch(e => console.error("Error replacing video track:", e));
            }

            const audioTrack = newStream.getAudioTracks()[0];
            const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
            if (audioSender && audioTrack) {
                audioSender.replaceTrack(audioTrack)
                    .catch(e => console.error("Error replacing audio track:", e));
            }
        });
    };

    const handleVideoToggle = () => {
        setVideoEnabled(prev => {
            const enabled = !prev;
            window.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
            return enabled;
        });
    };

    const handleAudioToggle = () => {
        setAudioEnabled(prev => {
            const enabled = !prev;
            window.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
            return enabled;
        });
    };

    const handleScreenShare = async () => {
        if (!screen) {
            await getDisplayMedia();
        } else {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }

            const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            replaceStream(camStream);
            setScreen(false);
        }
    };

    const handleEndCall = () => {
        Object.keys(connections.current).forEach(id => {
            if (connections.current[id]) {
                connections.current[id].close();
            }
        });

        connections.current = {};

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }

        window.location.href = "/";
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            const timestamp = Date.now(); // Use timestamp as unique identifier
            socketRef.current.emit('chat-message', {
                message: message,
                username: username,
                timestamp: timestamp
            });
            addMessage(message, username, new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setMessage('');
        }
    };

    const handleToggleChat = () => {
        const newShowChatState = !showChat;
        setShowChat(newShowChatState);
        if (newShowChatState) {
            setNewMessages(0);
        }
    };

    const addMessage = (data, sender, timestamp) => {
        setMessages(prev => {
            const messageExists = prev.some(msg => 
                msg.data === data && 
                msg.sender === sender && 
                msg.timestamp === timestamp
            );
            return messageExists ? prev : [...prev, { sender, data, timestamp }];
        });

        if (sender !== username && !showChat) {
            setNewMessages(prev => prev + 1);
        }
    };

    const connect = () => {
        setAskForUserName(false);
        getMedia();
    };

    useEffect(() => {
        if (videos.length > 0 && !mainVideo) {
            setMainVideo(videos[0]);
        }
    }, [videos, mainVideo]);

    return (
        <>
            {askForUserName ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)',
                    padding: '2rem',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: '#2d2d2d',
                        padding: '2.5rem',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        width: '100%',
                        maxWidth: '420px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h2 style={{
                            color: '#ffffff',
                            marginBottom: '1.5rem',
                            fontSize: '1.8rem',
                            fontWeight: '600'
                        }}>Join as a Guest</h2>

                        <TextField
                            id="username-input"
                            label="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            variant="outlined"
                            fullWidth
                            sx={{
                                marginBottom: '1.5rem',
                                '& .MuiOutlinedInput-root': {
                                    color: '#ffffff',
                                    '& fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.4)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#11cd75',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#11cd75',
                                },
                            }}
                        />

                        <Button
                            variant="contained"
                            onClick={connect}
                            sx={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                background: '#11cd75',
                                '&:hover': {
                                    background: '#0fb367',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Connect
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="meetVideoContainer">
                    <div className="buttonContainers">
                        <IconButton onClick={handleVideoToggle} style={{ color: "white" }}>
                            {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudioToggle} style={{ color: "white" }}>
                            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        
                        {!isMobile && !isTablet && (
                            <IconButton onClick={handleScreenShare} style={{ color: "white" }}>
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}
                        
                        <Badge
                            badgeContent={newMessages}
                            max={999}
                            color="secondary"
                            invisible={newMessages === 0}
                        >
                            <IconButton
                                onClick={handleToggleChat}
                                style={{ color: "white" }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <div className="videoContainer">
                        <div className="topBarVideos">
                            {videos.map(video => (
                                <video
                                    key={video.socketId}
                                    className={`smallVideo ${mainVideo?.socketId === video.socketId ? "selectedVideo" : ""}`}
                                    ref={ref => { if (ref && video.stream) ref.srcObject = video.stream; }}
                                    autoPlay
                                    playsInline
                                    onClick={() => setMainVideo(video)}
                                />
                            ))}
                        </div>

                        <div className="mainVideo">
                            <video
                                ref={ref => {
                                    if (ref && mainVideo?.stream) ref.srcObject = mainVideo.stream;
                                    else if (ref && !mainVideo) ref.srcObject = localVideoRef.current?.srcObject;
                                }}
                                autoPlay
                                playsInline
                                muted={!mainVideo}
                                className="bigVideo"
                            />
                        </div>

                        <div className="selfVideoWrapper">
                            <video
                                className="selfVideo"
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                            />
                        </div>
                    </div>

                    {showChat && (
                        <div className={`chatContainer ${showChat ? 'show' : ''}`}>
                            <div className="chatHeader">
                                <h3>Chat</h3>
                                <Button onClick={() => setShowChat(false)} style={{ marginLeft: 'auto', color: "red" }}>Close</Button>
                            </div>
                            <div className="chatMessages">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`chatMessage ${msg.sender === username ? "own" : ""}`}>
                                        <div className="messageHeader">
                                            <strong>{msg.sender}</strong> &nbsp;
                                            <span className="messageTime">{msg.timestamp}</span>
                                        </div>
                                        <div className="messageContent">{msg.data}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="chatInput">
                                <TextField
                                    onSubmit={handleSendMessage}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                                    placeholder="Type a message..."
                                    fullWidth
                                />
                                <Button type='submit' onClick={handleSendMessage} variant="contained">Send</Button>
                            </div>
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default VideoMeet;