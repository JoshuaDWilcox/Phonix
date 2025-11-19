import sys
import json

def main():
    print("[controller_bridge] ready", flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            print("[controller_bridge] bad json:", line, file=sys.stderr, flush=True)
            continue

        action = msg.get("action")
        if not action:
            continue

        # TODO: replace this with your real EchoPlay controller emulator.
        print(f"[controller_bridge] would execute: {action}", flush=True)

if __name__ == "__main__":
    main()
