"""
Speech-to-Text module using RealtimeSTT_faster for voice-controlled game controller.
Outputs transcribed words/phrases line-by-line to stdout for TypeScript integration.

Configuration optimized for low-latency game controller commands.
Based on Phonix implementation patterns and RealtimeSTT best practices.
"""
import sys
import signal
import logging

# Suppress RealtimeSTT status messages by setting logging level to WARNING
logging.basicConfig(level=logging.WARNING)
# Specifically suppress RealtimeSTT logger
logging.getLogger("RealtimeSTT").setLevel(logging.WARNING)
logging.getLogger("RealTimeSTT").setLevel(logging.WARNING)

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

# Words/phrases to filter out (status messages, not actual transcriptions)
FILTER_WORDS = {
    "speak", "now", "speaknow",  # Handle both separate and concatenated
    "recording", "transcribing", "listening", 
    "ready", "model", "loaded", "error", "warning"
}

def signal_handler(sig, frame):
    """Handle shutdown signals gracefully."""
    print("[speech] shutting down...", flush=True)
    # The context manager will handle cleanup automatically when sys.exit() unwinds the stack
    # The 'with' statement will call __exit__() exactly once
    sys.exit(0)

def extract_valid_words(text: str) -> list[str]:
    """
    Extract valid words from text, filtering out status messages.
    Aggressively strips filter words from long concatenated strings.
    """
    if not text or not text.strip():
        return []
    
    # Convert to lowercase and strip non-alphabetic
    text_lower = ''.join(c for c in text.lower() if c.isalpha() or c.isspace())
    
    # Sort filter words by length (longest first) for better matching
    sorted_filter_words = sorted(FILTER_WORDS, key=len, reverse=True)
    
    # Split by spaces
    words = text_lower.split()
    valid_words = []
    
    for word in words:
        if not word or len(word) < 2:
            continue
        
        # If word is suspiciously long (> 14 chars), aggressively strip filter words
        if len(word) > 14:
            cleaned = word
            max_iterations = 30  # More iterations for complex cases
            iteration = 0
            
            while iteration < max_iterations and cleaned:
                iteration += 1
                original = cleaned
                
                # Remove all filter words (try multiple times to catch all patterns)
                for fw in sorted_filter_words:
                    # Remove all occurrences
                    cleaned = cleaned.replace(fw, '')
                    # Remove repeated patterns (2x, 3x, etc.)
                    for repeat in range(10, 0, -1):  # Try up to 10 repetitions
                        pattern = fw * repeat
                        if pattern in cleaned:
                            cleaned = cleaned.replace(pattern, '')
                
                # If nothing changed, we're done
                if cleaned == original:
                    break
            
            # If nothing left after stripping, skip it
            if not cleaned or len(cleaned) < 2:
                continue
            
            # Final check: if it still contains any filter word, skip it
            if any(fw in cleaned for fw in FILTER_WORDS):
                continue
            
            word = cleaned
        
        # Final validation: must be reasonable length and not a status word
        if (len(word) >= 2 and 
            len(word) <= 20 and
            word not in FILTER_WORDS and
            not any(fw in word for fw in FILTER_WORDS)):
            valid_words.append(word)
    
    return valid_words

def is_valid_word(word: str) -> bool:
    """Check if a word is a valid transcription (not a status message)."""
    if not word or len(word) < 2:  # Too short to be meaningful
        return False
    if word in FILTER_WORDS:
        return False
    # Check if it's a repeated status message (like "speaknowspeaknow")
    if any(filter_word in word for filter_word in FILTER_WORDS):
        return False
    # Check if word is suspiciously long (likely concatenated status messages)
    if len(word) > 20:  # Normal words shouldn't be this long
        return False
    # Check for repeated patterns (like "speaknowspeaknow" or "recordingrecording")
    for filter_word in FILTER_WORDS:
        if filter_word * 2 in word:  # Repeated status word
            return False
    return True

def on_realtime_transcription_update(text: str):
    """
    Callback for real-time transcription updates.
    Outputs transcribed text to stdout IMMEDIATELY as speech is detected.
    This is the primary method for rapid word detection.
    """
    if text and text.strip():
        # Use extract_valid_words to handle concatenated status messages
        valid_words = extract_valid_words(text)
        # Only output if we found valid words (skip if text was all status messages)
        if valid_words:
            for word in valid_words:
                print(word, flush=True)  # Output each valid word immediately

def on_realtime_transcription_stabilized(text: str):
    """
    Callback for stabilized (higher quality) transcription.
    This fires after speech ends with the final, more accurate result.
    We use this as a backup/confirmation, but real-time updates are primary.
    """
    if text and text.strip():
        # Use extract_valid_words to handle concatenated status messages
        valid_words = extract_valid_words(text)
        for word in valid_words:
            print(word, flush=True)  # Output each valid word

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
                            # Use extract_valid_words to handle concatenated status messages
                            valid_words = extract_valid_words(text)
                            for word in valid_words:
                                print(word, flush=True)  # Output each valid word immediately
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
    # No finally block needed - the 'with' statement automatically calls __exit__()

if __name__ == "__main__":
    main()
