import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import LandingPage from './pages/LandingPage'
import Authentication from './pages/Authentication'
import { AuthProvider } from './Contexts/AuthContext'
import VideoMeet from './pages/VideoMeet'
import JoiningPage from './pages/JoiningPage' // Import your new JoiningPage component
import JoinAsGuest from './pages/JoinAsGuest'
import MeetingHistory from './pages/MeetingHistory'

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/join" element={<JoiningPage />} /> {/* Add this new route */}
            <Route path='/join-as-guest' element={<JoinAsGuest />} />
            <Route path='/history' element={<MeetingHistory />} />
            <Route path='/:meetingCode' element={<VideoMeet />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App