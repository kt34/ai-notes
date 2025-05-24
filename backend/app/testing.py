import websockets
import asyncio
import wave

async def send_audio():
    async with websockets.connect("ws://localhost:8000/ws/transcribe?user_id=test") as ws:
        with wave.open("test_audio.wav", "rb") as f:
            while True:
                data = f.readframes(1024)
                if not data:
                    break
                await ws.send(data)
                await asyncio.sleep(0.1)

asyncio.run(send_audio())