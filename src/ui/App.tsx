import { useState, useEffect } from 'react'
// import PhonixSquareLogo from './assets/phonixSquareLogo.jpg'
import PhonixTransparantLight from './assets/phonixTransparantLight.png'
import ProfilesDropdown from "./components/profilesDropdown.tsx";
import ProfileEditor from "./components/ProfileEditor.tsx";
import './App.css'

function App() {
  const [isRecording, setIsRecording] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)

  const [profiles, setProfiles] = useState<string[]>([]);
  const [currentProfile, setCurrentProfile] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfiles = async () => {
    const list = await window.api.getProfiles();
    setProfiles(list);
  };

  useEffect(() => {
    fetchProfiles();

    // Listen for session status updates (e.g. unexpected stops)
    const unsubscribeStatus = window.api.onSessionStatus((data: { isRunning: boolean; error?: string }) => {
      setIsRecording(data.isRunning ? 1 : 0);
      if (data.error) {
        alert(`Session stopped unexpectedly: ${data.error}`);
      }
    });

    // Listen for ready signal
    const unsubscribeReady = window.api.onRecorderReady(() => {
      console.log("Frontend received recorder ready signal");
      setIsRecording(2);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeReady();
    };
  }, []);

  const handleProfileSelect = (p: string) => {
    setCurrentProfile(p);
    window.api.setProfilePath(p);
  };

  return (
    <>
      <div>
        <button className="help-button" onClick={() => setShowInstructions(true)} title="Help">?</button>
        <img src={PhonixTransparantLight} className="logo phonix" alt="Phonix logo" />
      </div>
      <h1></h1>
      {isRecording === 0 && <p className="select-profile-label">Select Profile:</p>}
      <div className="card">
        {isRecording === 0 && (
          <div className="profile-controls">
            <ProfilesDropdown
              profiles={profiles}
              selectedProfile={currentProfile}
              onSelect={handleProfileSelect}
              disabled={isRecording !== 0}
            />
            <button className="icon-button" onClick={fetchProfiles} title="Refresh Profiles" disabled={isRecording !== 0}>
              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" fill="currentColor">
                {/* FontAwesome Free 6.x.x by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160H336c-17.7 0-32 14.3-32 32s14.3 32 32 32H463.5c0 0 0 0 0 0h.4c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1V448c0 17.7 14.3 32 32 32s32-14.3 32-32V396.9l17.6 17.5 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352H176c17.7 0 32-14.3 32-32s-14.3-32-32-32H48.4c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z" />
              </svg>
            </button>
            <button
              className="icon-button"
              onClick={() => setIsEditing(true)}
              title="Edit Profile"
              disabled={!currentProfile || isRecording !== 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" fill="currentColor">
                {/* FontAwesome Free 6.x.x by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
              </svg>
            </button>
            <button
              className="icon-button"
              onClick={async () => {
                const imported = await window.api.importProfile();
                if (imported) {
                  await fetchProfiles();
                  handleProfileSelect(imported);
                }
              }}
              title="Upload Profile"
              disabled={isRecording !== 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" fill="currentColor">
                {/* FontAwesome Free 6.x.x by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                <path d="M128 64c0-35.3 28.7-64 64-64H352V128c0 17.7 14.3 32 32 32H512V448c0 35.3-28.7 64-64 64H192c-35.3 0-64-28.7-64-64V336H302.1l-39 39c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l80-80c9.4-9.4 9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l39 39H128V64zm0 224v48H24c-13.3 0-24-10.7-24-24s10.7-24 24-24H128zM512 0L384 128H512V0z" />
              </svg>
            </button>
          </div>
        )}
        <button
          onClick={async () => {
            if (isRecording === 0) {
              // START
              try {
                // Set to loading state (1)
                setIsRecording(1);
                await window.api.startSession();

                // Wait for ready signal from backend
                window.api.onRecorderReady(() => {
                  console.log("Frontend received recorder ready signal");
                  setIsRecording(2);
                });

              } catch (err) {
                console.error("Failed to start session:", err);
                setIsRecording(0); // Reset on error
              }
            } else if (isRecording === 2) {
              // STOP
              try {
                await window.api.stopSession();
                setIsRecording(0);
              } catch (err) {
                console.error("Failed to stop session:", err);
              }
            }
          }}
          // Disable button only when in loading state (1)
          disabled={isRecording === 1}
        >
          {isRecording === 2 ? "Stop Recording" : (isRecording === 1 ? "Starting..." : "Start Recording")}
        </button>
        {isRecording === 2 && (
          <p className="ready-text" style={{ color: 'green', marginTop: '10px' }}>Program is running!</p>
        )}
      </div>
      <p className="read-the-docs">
      </p>

      {showInstructions && (
        <div className="modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>How to Use Phonix</h2>
            <p>1. Launch your favorite game.</p>
            <p>2. Select a control profile from the dropdown.</p>
            <p>3. Click <strong>Start Recording</strong>.</p>
            <p className="modal-footer">You can now voice your commands and play!</p>
            <button className="modal-close-btn" onClick={() => setShowInstructions(false)}>Got it</button>
          </div>
        </div>
      )}

      {isEditing && currentProfile && (
        <ProfileEditor
          profilePath={currentProfile}
          onClose={() => setIsEditing(false)}
          onSave={() => {
            setIsEditing(false);
            // Maybe show a toast or something
          }}
        />
      )}
    </>
  )
}

export default App
