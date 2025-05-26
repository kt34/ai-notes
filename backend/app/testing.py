import websockets
import asyncio
import wave

async def send_audio():
    try:
        async with websockets.connect("ws://localhost:8000/ws/transcribe?user_id=test") as ws:
            with wave.open("test_audio.wav", "rb") as f:
                while True:
                    data = f.readframes(1024)
                    if not data:
                        # Signal end of audio
                        await ws.send(b'')  # Send empty frame
                        break
                    try:
                        await ws.send(data)
                        await asyncio.sleep(0.1)
                    except websockets.exceptions.ConnectionClosedOK:
                        print("Server closed connection early")
                        return

            # Wait for final summary
            try:
                summary = await ws.recv()
                print("Final summary:", summary)
            except websockets.exceptions.ConnectionClosedOK:
                print("Connection closed normally after processing")

    except Exception as e:
        print(f"Connection failed: {str(e)}")

if __name__ == "__main__":
    # Reset event loop between runs
    asyncio.new_event_loop().run_until_complete(send_audio())