import { useState } from 'react'
// import PhonixSquareLogo from './assets/phonixSquareLogo.jpg'
import PhonixTransparantLight from './assets/phonixTransparantLight.png'
import ProfilesDropdown from "./components/profilesDropdown.tsx";
import './App.css'

function App() {
  const [isRecording, setIsRecording] = useState(0)

  return (
    <>
      <div>
          <img src={PhonixTransparantLight} className="logo phonix" alt="Phonix logo" />
      </div>
      <h1></h1>
      <div className="card">
        <ProfilesDropdown onSelect={(p) => window.api.setProfilePath(p)} />
        <button
          onClick={async () => {
            if (isRecording === 0) {
              // START
              try {
                await window.api.startSession();
                setIsRecording(1);
              } catch (err) {
                console.error("Failed to start session:", err);
              }
            } else {
              // STOP
              try {
                await window.api.stopSession();
                setIsRecording(0);
              } catch (err) {
                console.error("Failed to stop session:", err);
              }
            }
          }}
        >
          {isRecording === 1 ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
      <p className="read-the-docs">
      </p>
    </>
  )
}

export default App
