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
        <ProfilesDropdown onSelect={(p) => console.log("Selected:", p)} />
        <button onClick={() => setIsRecording((isRecording) => (isRecording === 0) ? 1 : 0)}>
            {isRecording === 1 ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
      <p className="read-the-docs">
      </p>
    </>
  )
}

export default App
