import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, IconButton, Badge } from '@mui/material';
import {
    Videocam as VideocamIcon, VideocamOff as VideocamOffIcon,
    Mic as MicIcon, MicOff as MicOffIcon,
    ScreenShare as ScreenShareIcon, StopScreenShare as StopScreenShareIcon,
    Chat as ChatIcon, CallEnd as CallEndIcon,
    Flag
} from '@mui/icons-material';
import io from 'socket.io-client';
import './VideoMeet.css';

const server_url = "https://unitytalk-backend.onrender.com"; // Change if needed
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

    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoRef = useRef();
    const videoRef = useRef([]);
    const connections = useRef({});
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Get user camera and mic
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
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            addMessage(data.message, data.username, timestamp);
            if (!showChat && data.username !== username) {
                setNewMessages(prev => prev + 1);
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

                    // Add current local stream tracks to the connection
                    if (window.localStream) {
                        window.localStream.getTracks().forEach(track => {
                            pc.addTrack(track, window.localStream);
                        });
                    }
                }
            });

            // Create offers to all other peers
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
            // Store current audio state before replacing stream
            const wasAudioEnabled = audioEnabled;

            // Stop current video tracks only (keep audio tracks)
            if (window.localStream) {
                window.localStream.getVideoTracks().forEach(track => track.stop());
            }

            // Get screen share stream (video only)
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false // We'll handle audio separately
            });

            // Get the current audio track if it exists
            const audioTrack = window.localStream?.getAudioTracks()[0];

            // Create a new stream combining screen share video and existing audio
            const newStream = new MediaStream();
            screenStream.getVideoTracks().forEach(track => newStream.addTrack(track));
            if (audioTrack) {
                newStream.addTrack(audioTrack);
                audioTrack.enabled = wasAudioEnabled; // Maintain previous audio state
            }

            // Handle when screen share is stopped
            screenStream.getVideoTracks()[0].onended = async () => {
                setScreen(false);
                try {
                    const camStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    // Maintain audio state when switching back to camera
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
        // Store current audio state
        const wasAudioEnabled = audioEnabled;

        // Update local video element
        localVideoRef.current.srcObject = newStream;

        // Store the new stream globally
        window.localStream = newStream;

        // Set audio state to previous value
        if (newStream.getAudioTracks().length > 0) {
            newStream.getAudioTracks()[0].enabled = wasAudioEnabled;
            setAudioEnabled(wasAudioEnabled); // Update state to match
        }

        // Replace tracks in all existing connections
        Object.keys(connections.current).forEach(id => {
            if (id === socketIdRef.current) return;

            const pc = connections.current[id];
            const senders = pc.getSenders();

            // Replace video track if available
            const videoTrack = newStream.getVideoTracks()[0];
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender && videoTrack) {
                videoSender.replaceTrack(videoTrack)
                    .catch(e => console.error("Error replacing video track:", e));
            }

            // Replace audio track if available
            const audioTrack = newStream.getAudioTracks()[0];
            const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
            if (audioSender && audioTrack) {
                audioSender.replaceTrack(audioTrack)
                    .catch(e => console.error("Error replacing audio track:", e));
            }
        });
    };




    const renegotiateAllConnections = () => {
        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            const connection = connections[id];
            const localStream = window.localStream; // Get the current local stream (screen or camera)

            // Replace the video track if screen is being shared
            const videoTrack = localStream.getVideoTracks()[0]; // Screen share or camera track
            const sender = connection.getSenders().find(s => s.track.kind === 'video');
            if (sender && videoTrack) {
                sender.replaceTrack(videoTrack);  // Replace with the new track
            }

            // Renegotiate the peer connection with the new stream
            connection.createOffer().then(offer => {
                return connection.setLocalDescription(offer);
            }).then(() => {
                socketRef.current.emit('signal', id, JSON.stringify({ sdp: connection.localDescription }));
            }).catch(err => {
                console.error("Error during renegotiation:", err);
            });
        }
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
            await getDisplayMedia();  // ✅ Use it here
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
        // Close all peer connections
        Object.keys(connections.current).forEach(id => {
            if (connections.current[id]) {
                connections.current[id].close();
            }
        });

        // Clear connections reference
        connections.current = {};

        // Disconnect socket if exists
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Stop all local media tracks if exists
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }

        // Redirect to home
        window.location.href = "/";
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            socketRef.current.emit('chat-message', {
                message: message,
                username: username,
                timestamp: timestamp
            });
            setMessage('');
        }
    };


    const handleToggleChat = () => {
        const newShowChatState = !showChat;
        setShowChat(newShowChatState);

        // Clear new messages count when opening chat
        if (newShowChatState) {
            setNewMessages(0);
        }
    };



    const addMessage = (data, sender) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { sender, data, timestamp }]);
        if (sender !== username && !showChat) {
            setNewMessages(prev => prev + 1);
        }
    };

    const connect = () => {
        setAskForUserName(false);
        getMedia();
    };

    const silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
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
                        <IconButton onClick={handleScreenShare} style={{ color: "white" }}>
                            {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                        </IconButton>
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
                        {/* Top bar - Other users */}
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

                        {/* Center - Main video */}
                        <div className="mainVideo">
                            <video
                                ref={ref => {
                                    if (ref && mainVideo?.stream) ref.srcObject = mainVideo.stream;
                                    else if (ref && !mainVideo) ref.srcObject = localVideoRef.current?.srcObject;
                                }}
                                autoPlay
                                playsInline
                                muted={!mainVideo} // local video should be muted
                                className="bigVideo"
                            />
                        </div>

                        {/* Bottom-right - Your own video */}
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
