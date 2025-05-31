import asyncio
import websockets
import json
import wave # For reading WAV files
import time

# --- Configuration ---
WEBSOCKET_URL_BASE = "ws://localhost:8000/ws/transcribe"
# !!! REPLACE THIS WITH A VALID TOKEN OBTAINED FROM YOUR FRONTEND AFTER LOGIN !!!
USER_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6IlJsbFo0MGxMRjBxcnNFR0siLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2trcGx3aXVja3VkZXRtbXp4b2RiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIwMjEyOWM0YS0yZDIxLTQ3YmQtYTU2Zi1iZjNkNTVhZGZhYzgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ4NjcwMjYwLCJpYXQiOjE3NDg2NjY2NjAsImVtYWlsIjoia2V2aW5hdG9uaUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoia2V2aW5hdG9uaUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiS2V2aW4iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjAyMTI5YzRhLTJkMjEtNDdiZC1hNTZmLWJmM2Q1NWFkZmFjOCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzQ4NjY2NjYwfV0sInNlc3Npb25faWQiOiI5MGFmYTJlYS1hZGM5LTRmZmItODE5NC01YTFjMTM0YmE3NTMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.iv3XfWEu2uLa9OZYVs22gNIpGk-JQedDZ_flnh6HTtc"

AUDIO_FILE_PATH = "test_speech.wav"  # Path to your WAV audio file

# --- Audio File Streaming Configuration ---
# How many audio frames to read and send at a time from the WAV file.
# Deepgram's recommended chunk size for live streaming is often between 20ms and 100ms of audio.
# For 16kHz, 16-bit mono audio:
# 1 second = 16000 samples * 2 bytes/sample = 32000 bytes
# 20ms = 0.02 * 32000 = 640 bytes
# 100ms = 0.1 * 32000 = 3200 bytes
# We'll use a chunk size that's a multiple of typical frame sizes and reasonable for streaming.
# For example, 1024 frames * 2 bytes/sample = 2048 bytes per chunk.
# Or directly specify bytes:
AUDIO_CHUNK_BYTES = 2048 # Send 2KB chunks (1024 samples if 16-bit mono)
# The SEND_INTERVAL should roughly match the duration of the audio chunk being sent
# Chunk duration = AUDIO_CHUNK_BYTES / (sample_rate * bytes_per_sample * num_channels)
# For 16kHz, 16-bit (2 bytes) mono (1 channel):
# Duration of 2048 bytes = 2048 / (16000 * 2 * 1) = 2048 / 32000 = 0.064 seconds (64 ms)
SEND_INTERVAL = 0.064 # Adjust this based on your chunk size and audio properties


async def run_websocket_test():
    if USER_TOKEN == "YOUR_VALID_JWT_ACCESS_TOKEN_HERE":
        print("ERROR: Please replace 'YOUR_VALID_JWT_ACCESS_TOKEN_HERE' with a valid token.")
        return

    uri = f"{WEBSOCKET_URL_BASE}?token={USER_TOKEN}"
    print(f"Attempting to connect to: {uri}")

    try:
        async with websockets.connect(uri) as websocket:
            print("Successfully connected to WebSocket.")

            # 1. Stream audio from the WAV file
            try:
                with wave.open(AUDIO_FILE_PATH, 'rb') as wf:
                    print(f"Opened audio file: {AUDIO_FILE_PATH}")
                    print(f"  Channels: {wf.getnchannels()}")
                    print(f"  Sample Width (bytes): {wf.getsampwidth()}") # Should be 2 for 16-bit
                    print(f"  Frame Rate (Hz): {wf.getframerate()}")   # Should be 16000
                    print(f"  Num Frames: {wf.getnframes()}")
                    print(f"  Compression Type: {wf.getcomptype()}")

                    # Validate audio format (optional but good practice)
                    if wf.getframerate() != 16000:
                        print(f"WARNING: Audio framerate is {wf.getframerate()}Hz, expected 16000Hz.")
                    if wf.getnchannels() != 1:
                        print(f"WARNING: Audio has {wf.getnchannels()} channels, expected 1 (mono).")
                    if wf.getsampwidth() != 2:
                        print(f"WARNING: Audio sample width is {wf.getsampwidth()} bytes, expected 2 (16-bit).")


                    print(f"Streaming audio in chunks of {AUDIO_CHUNK_BYTES} bytes...")
                    chunk_count = 0
                    while True:
                        audio_data = wf.readframes(AUDIO_CHUNK_BYTES // wf.getsampwidth() // wf.getnchannels()) # readframes takes number of frames
                        if not audio_data:
                            print("End of audio file reached.")
                            break
                        
                        await websocket.send(audio_data)
                        chunk_count += 1
                        print(f"Sent audio chunk {chunk_count} ({len(audio_data)} bytes)")
                        await asyncio.sleep(SEND_INTERVAL) # Simulate real-time streaming

            except FileNotFoundError:
                print(f"ERROR: Audio file not found at {AUDIO_FILE_PATH}")
                return
            except wave.Error as e:
                print(f"ERROR: Could not read WAV file. Is it a valid WAV? Error: {e}")
                return
            except Exception as e:
                print(f"ERROR: An unexpected error occurred during audio streaming: {e}")
                return


            # 2. Signal end of audio stream
            print("Sending end-of-stream signal (empty bytes)...")
            await websocket.send(b'') # Send empty bytes to signal audio end

            # 3. Receive responses from the server
            print("Waiting for responses from server...")
            try:
                while True:
                    message_str = await websocket.recv()
                    print(f"\n<-- Received from server:")
                    try:
                        message_json = json.loads(message_str)
                        print(json.dumps(message_json, indent=2))
                        if "summary" in message_json and "transcript" in message_json:
                            print("\nFinal summary and transcript received.")
                        if "error" in message_json:
                            print(f"!!! Server sent an error: {message_json['error']} !!!")
                    except json.JSONDecodeError:
                        print(f"Raw message (not JSON): {message_str}")

            except websockets.exceptions.ConnectionClosedOK:
                print("\nServer closed the connection gracefully (ConnectionClosedOK).")
            except websockets.exceptions.ConnectionClosedError as e:
                print(f"\nServer closed the connection with error: {e} (ConnectionClosedError).")
            except websockets.exceptions.ConnectionClosed as e:
                print(f"\nConnection closed: {e}.")
            except Exception as e:
                print(f"An error occurred while receiving: {e}")

    except websockets.exceptions.InvalidStatusCode as e:
        print(f"Failed to connect: Invalid status code {e.status_code}. Response headers: {e.headers}")
        if e.status_code == 403 or e.status_code == 4001: # 4001 might be your custom WebSocket close code for auth
             print("This could be due to an invalid or expired token, or other auth issues.")
    except ConnectionRefusedError:
        print("Failed to connect: Connection refused. Is the backend server running at localhost:8000?")
    except Exception as e:
        print(f"An unexpected error occurred: {type(e).__name__} - {e}")

if __name__ == "__main__":
    asyncio.run(run_websocket_test())
