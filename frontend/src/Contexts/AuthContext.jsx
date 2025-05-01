import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import server from "../environment";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://localhost:3000/api/v1/users"
})

const meeting = axios.create({
    baseURL: "http://localhost:3000/api/meetings"
})


export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);


    const [userData, setUserData] = useState(authContext);


    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            });


            if (request.status === 201) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            console.log(username, password)
            console.log(request.data)

            if (request.status === 200) {
                localStorage.setItem("token", request.data.token);
                router("/")
            }
        } catch (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found in localStorage");
            throw new Error("Please login again");
        }
        try {
            const token = localStorage.getItem("token");
            console.log("Token being sent:", token); // Debug log

            const response = await meeting.post("/add_meeting",
                { meeting_code: meetingCode },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true // Add this for CORS
                }
            );
            // ... rest of the code
        } catch (err) {
            console.error("Full error details:", err);
            if (err.response) {
                console.error("Response data:", err.response.data);
                console.error("Response status:", err.response.status);
                console.error("Response headers:", err.response.headers);
            }
            throw err;
        }
    };

    const getHistoryOfUser = async () => {
        try {
            const response = await meeting.get("/get_meetings", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            return response.data;
        } catch (err) {
            console.error("Failed to fetch history:", err);
            throw err;
        }
    };
    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}