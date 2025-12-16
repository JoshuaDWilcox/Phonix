"""
Controller emulation bridge for Phonix.
Handles Xbox controller emulation using vgamepad library.
Parses keymap commands from TypeScript and executes them.
"""
import sys
import json
import time
import threading
import vgamepad as vg

# Global gamepad instance
gamepad = None
gamepad_lock = threading.Lock()

def init_gamepad():
    """Initialize the virtual Xbox controller."""
    global gamepad
    if gamepad is None:
        try:
            gamepad = vg.VX360Gamepad()
            print("[controller_bridge] virtual Xbox controller initialized", flush=True)
        except AssertionError as e:
            if "ViGEmBus" in str(e):
                print("[controller_bridge] ERROR: ViGEmBus driver not installed!", file=sys.stderr, flush=True)
                print("[controller_bridge] Please install ViGEmBus from: https://github.com/ViGEm/ViGEmBus/releases", file=sys.stderr, flush=True)
                print("[controller_bridge] After installation, restart your computer and try again.", file=sys.stderr, flush=True)
            raise
    return gamepad

def execute_keymap(keymap: list):
    """
    Execute a keymap command sequence.
    
    Keymap format examples:
    - ["left_joystick_float", x, y, duration, "left_joystick_float", 0, 0]
    - ["right_joystick_float", x, y, duration, "right_joystick_float", 0, 0]
    - ["pressXUSB_GAMEPAD_DPAD_RIGHT", duration, "releaseXUSB_GAMEPAD_DPAD_RIGHT"]
    
    Commands are executed sequentially with timing delays.
    """
    if not keymap or len(keymap) < 3:
        print(f"[controller_bridge] invalid keymap: {keymap}", file=sys.stderr, flush=True)
        return
    
    gp = init_gamepad()
    
    i = 0
    while i < len(keymap):
        command = keymap[i]
        
        # Handle numeric delays (standalone numbers between commands)
        if isinstance(command, (int, float)) or (isinstance(command, str) and command.replace('.', '').replace('-', '').isdigit()):
            # This is a delay value, sleep and skip it
            delay = float(command)
            time.sleep(delay)
            i += 1
            continue
        
        if command == "left_joystick_float":
            if i + 3 < len(keymap):
                x = float(keymap[i + 1])
                y = float(keymap[i + 2])
                duration = float(keymap[i + 3])
                
                with gamepad_lock:
                    gp.left_joystick_float(x_value_float=x, y_value_float=y)
                    gp.update()
                
                time.sleep(duration)
                i += 4
                
                # Check if next command is a reset (same joystick command with 0, 0)
                if i + 2 < len(keymap) and keymap[i] == "left_joystick_float":
                    reset_x = float(keymap[i + 1])
                    reset_y = float(keymap[i + 2])
                    with gamepad_lock:
                        gp.left_joystick_float(x_value_float=reset_x, y_value_float=reset_y)
                        gp.update()
                    i += 3  # Consume reset command, x, y
            else:
                print(f"[controller_bridge] invalid left_joystick_float command", file=sys.stderr, flush=True)
                break
                
        elif command == "right_joystick_float":
            if i + 3 < len(keymap):
                x = float(keymap[i + 1])
                y = float(keymap[i + 2])
                duration = float(keymap[i + 3])
                
                with gamepad_lock:
                    gp.right_joystick_float(x_value_float=x, y_value_float=y)
                    gp.update()
                
                time.sleep(duration)
                i += 4
                
                # Check if next command is a reset (same joystick command with 0, 0)
                if i + 2 < len(keymap) and keymap[i] == "right_joystick_float":
                    reset_x = float(keymap[i + 1])
                    reset_y = float(keymap[i + 2])
                    with gamepad_lock:
                        gp.right_joystick_float(x_value_float=reset_x, y_value_float=reset_y)
                        gp.update()
                    i += 3  # Consume reset command, x, y
            else:
                print(f"[controller_bridge] invalid right_joystick_float command", file=sys.stderr, flush=True)
                break
                
        elif command.startswith("press") and "TRIGGER" in command:
            # Trigger press: "pressXUSB_GAMEPAD_LEFT_TRIGGER" or "pressXUSB_GAMEPAD_RIGHT_TRIGGER"
            # Triggers are analog (0.0 to 1.0), not digital buttons
            trigger_name = command[5:]  # Remove "press" prefix
            if i + 1 < len(keymap):
                duration = float(keymap[i + 1])
                
                if trigger_name == "XUSB_GAMEPAD_LEFT_TRIGGER":
                    with gamepad_lock:
                        gp.left_trigger(value=255)  # Full trigger press (0-255)
                        gp.update()
                    time.sleep(duration)
                    # Trigger stays pressed until explicit release command
                    i += 2
                elif trigger_name == "XUSB_GAMEPAD_RIGHT_TRIGGER":
                    with gamepad_lock:
                        gp.right_trigger(value=255)  # Full trigger press (0-255)
                        gp.update()
                    time.sleep(duration)
                    # Trigger stays pressed until explicit release command
                    i += 2
                else:
                    print(f"[controller_bridge] unknown trigger: {trigger_name}", file=sys.stderr, flush=True)
                    i += 1
            else:
                print(f"[controller_bridge] invalid trigger press command", file=sys.stderr, flush=True)
                break
                
        elif command.startswith("press"):
            # Button press: "pressXUSB_GAMEPAD_DPAD_RIGHT" -> button is "XUSB_GAMEPAD_DPAD_RIGHT"
            button_name = command[5:]  # Remove "press" prefix
            if i + 1 < len(keymap):
                duration = float(keymap[i + 1])
                
                # Map button names to vgamepad button constants
                button_map = {
                    "XUSB_GAMEPAD_DPAD_UP": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP,
                    "XUSB_GAMEPAD_DPAD_DOWN": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN,
                    "XUSB_GAMEPAD_DPAD_LEFT": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT,
                    "XUSB_GAMEPAD_DPAD_RIGHT": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT,
                    "XUSB_GAMEPAD_A": vg.XUSB_BUTTON.XUSB_GAMEPAD_A,
                    "XUSB_GAMEPAD_B": vg.XUSB_BUTTON.XUSB_GAMEPAD_B,
                    "XUSB_GAMEPAD_X": vg.XUSB_BUTTON.XUSB_GAMEPAD_X,
                    "XUSB_GAMEPAD_Y": vg.XUSB_BUTTON.XUSB_GAMEPAD_Y,
                    "XUSB_GAMEPAD_LEFT_SHOULDER": vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER,
                    "XUSB_GAMEPAD_RIGHT_SHOULDER": vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER,
                    "XUSB_GAMEPAD_LEFT_THUMB": vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_THUMB,
                    "XUSB_GAMEPAD_RIGHT_THUMB": vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_THUMB,
                    "XUSB_GAMEPAD_START": vg.XUSB_BUTTON.XUSB_GAMEPAD_START,
                    "XUSB_GAMEPAD_BACK": vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK,
                    "XUSB_GAMEPAD_GUIDE": vg.XUSB_BUTTON.XUSB_GAMEPAD_GUIDE,
                }
                
                button = button_map.get(button_name)
                if button:
                    with gamepad_lock:
                        gp.press_button(button)
                        gp.update()
                    
                    time.sleep(duration)
                    i += 2
                else:
                    print(f"[controller_bridge] unknown button: {button_name}", file=sys.stderr, flush=True)
                    i += 1
            else:
                print(f"[controller_bridge] invalid press command", file=sys.stderr, flush=True)
                break
                
        elif command.startswith("release"):
            # Button release: "releaseXUSB_GAMEPAD_DPAD_RIGHT" -> button is "XUSB_GAMEPAD_DPAD_RIGHT"
            button_name = command[7:]  # Remove "release" prefix
            
            # Handle trigger releases
            if button_name == "XUSB_GAMEPAD_LEFT_TRIGGER":
                with gamepad_lock:
                    gp.left_trigger(value=0)
                    gp.update()
                i += 1
            elif button_name == "XUSB_GAMEPAD_RIGHT_TRIGGER":
                with gamepad_lock:
                    gp.right_trigger(value=0)
                    gp.update()
                i += 1
            else:
                # Map button names to vgamepad button constants
                button_map = {
                "XUSB_GAMEPAD_DPAD_UP": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP,
                "XUSB_GAMEPAD_DPAD_DOWN": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN,
                "XUSB_GAMEPAD_DPAD_LEFT": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT,
                "XUSB_GAMEPAD_DPAD_RIGHT": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT,
                "XUSB_GAMEPAD_A": vg.XUSB_BUTTON.XUSB_GAMEPAD_A,
                "XUSB_GAMEPAD_B": vg.XUSB_BUTTON.XUSB_GAMEPAD_B,
                "XUSB_GAMEPAD_X": vg.XUSB_BUTTON.XUSB_GAMEPAD_X,
                "XUSB_GAMEPAD_Y": vg.XUSB_BUTTON.XUSB_GAMEPAD_Y,
                "XUSB_GAMEPAD_LEFT_SHOULDER": vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER,
                "XUSB_GAMEPAD_RIGHT_SHOULDER": vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER,
                "XUSB_GAMEPAD_LEFT_THUMB": vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_THUMB,
                "XUSB_GAMEPAD_RIGHT_THUMB": vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_THUMB,
                "XUSB_GAMEPAD_START": vg.XUSB_BUTTON.XUSB_GAMEPAD_START,
                "XUSB_GAMEPAD_BACK": vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK,
                "XUSB_GAMEPAD_GUIDE": vg.XUSB_BUTTON.XUSB_GAMEPAD_GUIDE,
            }
            
            button = button_map.get(button_name)
            if button:
                with gamepad_lock:
                    gp.release_button(button)
                    gp.update()
            
            i += 1
        else:
            # Unknown command, skip it
            print(f"[controller_bridge] unknown command: {command}", file=sys.stderr, flush=True)
            i += 1

def main():
    """Main function to handle controller commands from stdin."""
    # Initialize gamepad with retry logic
    # Sometimes vgamepad fails to initialize on first try, so we retry a few times
    max_retries = 3
    for attempt in range(max_retries):
        try:
            init_gamepad()
            print("[controller_bridge] ready", flush=True)
            break
        except (AssertionError, Exception) as e:
            if attempt < max_retries - 1:
                print(f"[controller_bridge] WARNING: Failed to initialize (attempt {attempt+1}/{max_retries}). Retrying...", file=sys.stderr, flush=True)
                time.sleep(2)
            else:
                print("[controller_bridge] ERROR: Failed to initialize virtual controller after retries", file=sys.stderr, flush=True)
                print(f"[controller_bridge] Error: {e}", file=sys.stderr, flush=True)
                sys.exit(1)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            print(f"[controller_bridge] bad json: {line}", file=sys.stderr, flush=True)
            continue

        action = msg.get("action")
        if not action:
            continue

        try:
            # Action is a JSON string of the keymap array, parse it
            keymap = json.loads(action) if isinstance(action, str) else action
            
            # Check if gamepad is initialized before executing
            if gamepad is None:
                print(f"[controller_bridge] WARNING: Controller not initialized, cannot execute: {keymap}", file=sys.stderr, flush=True)
                continue
                
            execute_keymap(keymap)
        except Exception as e:
            print(f"[controller_bridge] error executing action: {e}", file=sys.stderr, flush=True)
            import traceback
            traceback.print_exc(file=sys.stderr)

if __name__ == "__main__":
    main()
