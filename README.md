# Phonix
Phonix is a gaming accessibility tool geared towards individuals with motor function disabilities, enabling everyone to play games with their voice, using standard controllre or keyboard inputs.

# Introduction

Many people with physical disabilities are excluded from playing video games because traditional controllers and keyboards require fine motor skills. This project addresses accessibility by enabling players to control games using only their voice. By providing an alternative input method, the project helps ensure that gaming becomes more inclusive and enjoyable for everyone. 

# Objectives

    Design a user-friendly interface that enables users with motor function disabilities to control games using their voice.

    Develop a real-time speech-to-input converter for low-latency and accessible gaming experiences

    Provide customizable input options to accommodate a range of physical abilities and preferences

    Promote inclusion by expanding access to video games for users with restricted motor functions

# Scope

We will enable users to create custom voice commands (for example, binding “uppercut” to inputs left, right, up, B) and manage multiple command profiles for different games. The project will include a front-end for selecting and editing profiles, a database to store them, and a working input emulator. It will be run from a single command-line prompt or executable. As a stretch goal, we aim to support homonyms for better accent handling. All features are scoped to be achievable within the timeline of this course.

# Proposed Solution

The proposed solution is a Python-based desktop application with a Electron front end and a voice recognition backend. At a high level, the app listens for predefined spoken commands, translates them into text, matches them against a user-defined mapping, and sends the corresponding keyboard or controller input to the active game. The target users are PC gamers who want an accessible, hands-free method to control game actions. 

# Technology Stack

    Frontend: Electron ( electronjs.org )

    Backend: Python

    Database: PostgreSQL

    Deployment Platform: Windows

    Speech-To-Text Model: Fork from RealtimeSTT ( https://github.com/mdv314/RealtimeSTT_faster )

# Expected Outcomes

 The final deliverable will be a working prototype of Phonix with the following capabilities:

    Enables users to play PC games through voice commands. 

    Customizable command mappings stored in a database. 

    Demonstrated testing results showing successful voice-to-action conversion. 

    Increased accessibility for users who cannot use conventional input devices. 

# References

- RealtimeSTT_faster. (2024). mdv314/RealtimeSTT_faster. GitHub. https://github.com/mdv314/RealtimeSTT_faster
- RealtimeSTT. (2024). KoljaB/RealtimeSTT. GitHub. https://github.com/KoljaB/RealtimeSTT
- Radford, A., et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision. OpenAI Whisper. https://github.com/openai/whisper
- Electron. (2024). Electron - Build cross-platform desktop apps with JavaScript, HTML, and CSS. https://www.electronjs.org/

