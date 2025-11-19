import time
import sys

def main():
    # Let the TS side know we're alive
    print("[speech_stub] ready", flush=True)

    # DEMO: emit a few "recognized" phrases
    words = ["jump", "forward", "uppercut"]

    for w in words:
        print(w, flush=True)   # each line = one phrase/word
        time.sleep(0.8)

    # Then just sit there (or exit, up to you)
    # For your real code, you'll loop forever on microphone input instead.

if __name__ == "__main__":
    main()
