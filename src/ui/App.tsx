import { useState } from 'react'
import PhonixSquareLogo from './assets/phonixSquareLogo.jpg'
import ProfilesDropdown from "./components/profilesDropdown.tsx";
import './App.css'

function App() {
  const [isRecording, setIsRecording] = useState(0)

  return (
    <>
      <div>
          <img src={PhonixSquareLogo} className="logo phonix" alt="Phonix logo" />
      </div>
      <h1></h1>
      <div className="card">
        <button onClick={() => setIsRecording((isRecording) => (isRecording === 0) ? 1 : 0)}>
            {isRecording === 1 ? "Stop Recording" : "Start Recording"}
        </button>
        <p>
          Profiles button coming soon
        </p>
          <ProfilesDropdown onSelect={(p) => console.log("Selected:", p)} />
      </div>
      <p className="read-the-docs">

      </p>
    </>
  )
}

export default App
