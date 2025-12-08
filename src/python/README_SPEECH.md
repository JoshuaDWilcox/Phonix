# Speech-to-Text Configuration

This module uses [RealtimeSTT_faster](https://github.com/mdv314/RealtimeSTT_faster) for real-time speech-to-text transcription optimized for voice-controlled game controllers.

## Installation

Install Python dependencies:

```bash
pip install -r src/python/requirements.txt
```

Or from the project root:

```bash
pip install -r src/python/requirements.txt
```

**Note:** On first run, RealtimeSTT will automatically download the Whisper model (tiny.en ~75MB). This is a one-time download.

## Configuration

The speech-to-text settings are configured in `speech_stub.py` in the `CONFIG` dictionary. Key settings:

### Model Selection
- **`model`**: Main transcription model
  - `"tiny.en"` (default): Fastest, English-only, ~75MB
  - `"base.en"`: Better accuracy, slightly slower
  - `"small.en"`: Higher accuracy, more latency
  - See [RealtimeSTT documentation](https://github.com/mdv314/RealtimeSTT_faster) for all options

### Real-time Transcription
- **`realtime_processing_pause`**: Time between transcription updates (lower = more frequent)
  - Default: `0.1` seconds for responsive game commands
- **`realtime_batch_size`**: Batch processing size for efficiency
  - Default: `16`

### Voice Activity Detection (VAD)
- **`silero_sensitivity`**: Voice detection sensitivity (0.0-1.0)
  - Default: `0.5` (balanced)
  - Increase if missing commands, decrease if too sensitive
- **`webrtc_sensitivity`**: WebRTC VAD sensitivity (0-3)
  - Default: `2` (moderate)
  - Lower = more sensitive

### Recording Timing
- **`post_speech_silence_duration`**: Silence duration to end recording
  - Default: `0.3` seconds (optimized for quick commands)
- **`min_gap_between_recordings`**: Minimum time between commands
  - Default: `0.5` seconds
- **`min_length_of_recording`**: Minimum recording length
  - Default: `0.5` seconds

## Usage

The module outputs transcribed text line-by-line to stdout, which is consumed by the TypeScript backend (`speech.ts`).

### Output Format
- Each transcribed word/phrase is printed on a new line
- Log messages are prefixed with `[speech]` and sent to stderr
- Ready signal: `[speech] ready` indicates initialization complete

### Tuning for Your Environment

1. **If commands are missed:**
   - Increase `silero_sensitivity` (e.g., 0.6-0.7)
   - Decrease `webrtc_sensitivity` (e.g., 1)
   - Decrease `post_speech_silence_duration` (e.g., 0.2)

2. **If too many false positives:**
   - Decrease `silero_sensitivity` (e.g., 0.3-0.4)
   - Increase `webrtc_sensitivity` (e.g., 3)
   - Increase `post_speech_silence_duration` (e.g., 0.5)

3. **For better accuracy (higher latency):**
   - Change `model` to `"base.en"` or `"small.en"`
   - Increase `realtime_processing_pause` (e.g., 0.2)

4. **For lower latency (lower accuracy):**
   - Keep `model` as `"tiny.en"`
   - Decrease `realtime_processing_pause` (e.g., 0.05)

## Architecture

The speech module follows a **Bridge Pattern**:
- Python handles speech-to-text processing
- TypeScript handles command parsing and controller emulation
- Communication via stdout/stdin (line-based protocol)

This separation allows:
- Easy swapping of speech engines
- Independent optimization of each component
- Clear separation of concerns

## Troubleshooting

### Model Download Issues
If the model fails to download, it will be cached in `~/.cache/whisper/` (Linux/Mac) or `%LOCALAPPDATA%\whisper\` (Windows).

### Microphone Access
Ensure your system has granted microphone permissions to the application.

### Performance Issues
- Use `tiny.en` model for best performance
- Enable `silero_use_onnx=True` for faster VAD
- Adjust batch sizes based on your hardware

### Error Messages
- Check stderr for detailed error messages
- Common issues: missing dependencies, microphone access, model download failures

