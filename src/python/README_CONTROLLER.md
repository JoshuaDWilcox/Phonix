# Controller Emulation Setup

This module uses [vgamepad](https://github.com/nefarius/vgamepad) for Xbox controller emulation on Windows.

## Prerequisites

**IMPORTANT**: vgamepad requires the ViGEmBus driver to be installed on Windows.

### Installing ViGEmBus

1. Download the latest ViGEmBus installer from: https://github.com/ViGEm/ViGEmBus/releases
2. Run the installer (requires administrator privileges)
3. **Restart your computer** after installation
4. Verify installation by checking Device Manager → System devices → "ViGEm Bus Driver"

### Installing Python Dependencies

```bash
pip install -r src/python/requirements.txt
```

This will install:
- `vgamepad>=0.1.0` - Virtual gamepad library
- Other dependencies (realtimestt, numpy)

## Usage

The controller bridge receives keymap commands from the TypeScript backend and executes them on a virtual Xbox controller.

### Keymap Format

The keymaps are defined in profile JSON files (e.g., `fighting.json`) and follow this format:

#### Joystick Commands
```json
["left_joystick_float", x, y, duration, "left_joystick_float", 0, 0]
```
- Sets left joystick to position (x, y) for `duration` seconds, then resets to (0, 0)
- Values range from -1.0 to 1.0
- Example: `["left_joystick_float", 1.0, 0.0, 0.5, "left_joystick_float", 0, 0]` - push right for 0.5s

#### Button Commands
```json
["pressXUSB_GAMEPAD_A", duration, "releaseXUSB_GAMEPAD_A"]
```
- Presses button A for `duration` seconds, then releases
- Supported buttons: A, B, X, Y, D-pad directions, shoulders, triggers, start, back, guide

#### Trigger Commands
```json
["pressXUSB_GAMEPAD_LEFT_TRIGGER", duration, "releaseXUSB_GAMEPAD_LEFT_TRIGGER"]
```
- Presses analog trigger for `duration` seconds, then releases
- Supports left and right triggers

## Troubleshooting

### "ViGEmBus not installed" Error

If you see: `AssertionError: The virtual device could not connect to ViGEmBus`

1. Download and install ViGEmBus from: https://github.com/ViGEm/ViGEmBus/releases
2. **Restart your computer** (required for driver installation)
3. Verify the driver is installed in Device Manager
4. Try running the application again

### Controller Not Appearing in Games

- Ensure ViGEmBus is properly installed and your computer has been restarted
- Some games may require the virtual controller to be "connected" before launching
- Try starting the Phonix session before launching your game

### Permission Issues

- ViGEmBus installation requires administrator privileges
- The virtual controller should work without admin rights after installation

## Architecture

The controller module follows a **Bridge Pattern**:
- TypeScript backend parses voice commands and sends keymap arrays
- Python controller bridge receives keymaps and executes them on virtual Xbox controller
- Communication via stdin/stdout (JSON-based protocol)

This separation allows:
- Easy swapping of controller emulation libraries
- Independent testing of controller commands
- Clear separation of concerns


