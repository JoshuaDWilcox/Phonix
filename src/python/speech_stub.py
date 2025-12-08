"""
Speech-to-Text module using RealtimeSTT_faster for voice-controlled game controller.
Outputs transcribed words/phrases line-by-line to stdout for TypeScript integration.

Configuration optimized for low-latency game controller commands.
Based on Phonix implementation patterns and RealtimeSTT best practices.
"""
import sys
import signal
from RealtimeSTT import AudioToTextRecorder

# Configuration for low-latency game controller use
# These settings prioritize speed and responsiveness for voice commands
CONFIG = {
    # Model selection: 'tiny.en' for lowest latency with English-only
    # Options: 'tiny', 'tiny.en', 'base', 'base.en', 'small', 'small.en', 'medium', 'medium.en'
    "model": "tiny.en",  # English-only tiny model for fastest performance
    
    # Real-time transcription settings
    "realtime_model_type": "tiny.en",  # Fast model for real-time updates
    "realtime_processing_pause": 0.02,  # Very frequent updates (0.02s for rapid word detection)
    "realtime_batch_size": 4,  # Very small batch for fastest processing
    
    # Voice Activity Detection (VAD) settings - more sensitive for rapid word detection
    "silero_sensitivity": 0.6,  # More sensitive (0.0-1.0, higher = more sensitive)
    "silero_use_onnx": True,  # Use ONNX for faster performance
    "silero_deactivity_detection": False,  # Use WebRTC VAD for lower latency
    "webrtc_sensitivity": 1,  # More sensitive (0-3, lower = more sensitive) - detects speech faster
    
    # Recording timing settings - optimized for rapid individual word detection
    "post_speech_silence_duration": 0.15,  # Very short silence to end recording (0.15s for rapid words)
    "min_gap_between_recordings": 0.1,  # Very short gap between commands (0.1s for rapid fire)
    "min_length_of_recording": 0.2,  # Very short minimum recording length (0.2s for single words)
    "pre_recording_buffer_duration": 0.05,  # Minimal buffer before recording starts
    
    # Language and processing
    "language": "en",  # English
    "use_microphone": True,  # Use default microphone
}

# Global recorder instance
recorder = None

def signal_handler(sig, frame):
    """Handle shutdown signals gracefully."""
    global recorder
    print("[speech] shutting down...", flush=True)
    if recorder:
        try:
            recorder.__exit__(None, None, None)
        except:
            pass
    sys.exit(0)

def on_realtime_transcription_update(text: str):
    """
    Callback for real-time transcription updates.
    Outputs transcribed text to stdout IMMEDIATELY as speech is detected.
    This is the primary method for rapid word detection.
    """
    if text and text.strip():
        # Clean and output the transcribed text immediately
        cleaned = text.strip()
        # Split by spaces to handle multiple words, output each separately
        words = cleaned.split()
        for word in words:
            # Strip all non-alphabetical characters and convert to lowercase
            word_clean = ''.join(c for c in word if c.isalpha()).lower()
            if word_clean:  # Only output if there are letters left
                print(word_clean, flush=True)  # Output each word immediately

def on_realtime_transcription_stabilized(text: str):
    """
    Callback for stabilized (higher quality) transcription.
    This fires after speech ends with the final, more accurate result.
    We use this as a backup/confirmation, but real-time updates are primary.
    """
    if text and text.strip():
        # Output stabilized text - this is the final, accurate transcription
        cleaned = text.strip()
        # Split and output each word separately for consistency
        words = cleaned.split()
        for word in words:
            # Strip all non-alphabetical characters and convert to lowercase
            word_clean = ''.join(c for c in word if c.isalpha()).lower()
            if word_clean:  # Only output if there are letters left
                print(word_clean, flush=True)  # Output each word

def main():
    """Main function to initialize and run the speech-to-text recorder."""
    global recorder
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Notify TypeScript that we're ready (send to stderr so it's not treated as a word)
    print("[speech] ready", file=sys.stderr, flush=True)
    
    try:
        # Initialize AudioToTextRecorder with configuration
        # Use context manager pattern for proper resource cleanup
        with AudioToTextRecorder(
            model=CONFIG["model"],
            language=CONFIG["language"],
            use_microphone=CONFIG["use_microphone"],
            
            # Real-time transcription settings
            realtime_model_type=CONFIG["realtime_model_type"],
            realtime_processing_pause=CONFIG["realtime_processing_pause"],
            realtime_batch_size=CONFIG["realtime_batch_size"],
            on_realtime_transcription_update=on_realtime_transcription_update,
            on_realtime_transcription_stabilized=on_realtime_transcription_stabilized,
            
            # VAD settings
            silero_sensitivity=CONFIG["silero_sensitivity"],
            silero_use_onnx=CONFIG["silero_use_onnx"],
            silero_deactivity_detection=CONFIG["silero_deactivity_detection"],
            webrtc_sensitivity=CONFIG["webrtc_sensitivity"],
            
            # Recording timing
            post_speech_silence_duration=CONFIG["post_speech_silence_duration"],
            min_gap_between_recordings=CONFIG["min_gap_between_recordings"],
            min_length_of_recording=CONFIG["min_length_of_recording"],
            pre_recording_buffer_duration=CONFIG["pre_recording_buffer_duration"],
        ) as recorder_instance:
            recorder = recorder_instance
            print("[speech] model loaded, listening...", file=sys.stderr, flush=True)
            
            # Main loop: use recorder.text() for reliable transcription
            # This blocks until speech is detected and transcribed, then outputs immediately
            # We also have callbacks as backup, but text() is more reliable
            import time
            import threading
            
            # Flag to track if we're processing
            processing = True
            
            def transcription_loop():
                """Main transcription loop - processes speech continuously"""
                nonlocal processing
                while processing:
                    try:
                        # Get transcribed text (blocks until speech is detected and transcribed)
                        # With aggressive VAD settings, this should fire for each word/phrase
                        text = recorder.text()
                        if text and text.strip():
                            cleaned = text.strip()
                            # Split and output each word separately
                            words = cleaned.split()
                            for word in words:
                                # Strip all non-alphabetical characters and convert to lowercase
                                word_clean = ''.join(c for c in word if c.isalpha()).lower()
                                if word_clean:  # Only output if there are letters left
                                    print(word_clean, flush=True)  # Output each word immediately
                    except Exception as e:
                        if processing:  # Only log if we're still supposed to be running
                            # Ignore EOF errors when shutting down
                            if "EOF" not in str(e) and "BrokenPipe" not in str(e):
                                print(f"[speech] transcription error: {str(e)}", file=sys.stderr, flush=True)
                            time.sleep(0.1)
            
            # Start transcription in a thread so we can handle shutdown
            transcription_thread = threading.Thread(target=transcription_loop, daemon=True)
            transcription_thread.start()
            
            # Keep main thread alive
            try:
                while True:
                    time.sleep(0.1)
            except KeyboardInterrupt:
                processing = False
                raise
            
    except KeyboardInterrupt:
        print("[speech] interrupted by user", flush=True)
    except Exception as e:
        print(f"[speech] error: {str(e)}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
    finally:
        if recorder:
            try:
                recorder.__exit__(None, None, None)
            except:
                pass

if __name__ == "__main__":
    main()
