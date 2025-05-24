import json
from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .stt import STTClient
from .summarizer import Summarizer
from .deps import get_redis, supabase

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

stt_client = STTClient(settings.DEEPGRAM_API_KEY)
summarizer = Summarizer(settings.OPENAI_API_KEY)

@app.websocket("/ws/transcribe")
async def websocket_transcribe(ws: WebSocket, redis=Depends(get_redis)):
    await ws.accept()
    async def audio_gen():
        try:
            while True:
                msg = await ws.receive_bytes()
                yield {'buffer': msg}
        except:
            return

    full_text = []
    # Stream STT
    async for partial in stt_client.stream_transcribe(audio_gen()):
        full_text.append(partial)
        # send partial back for live captions
        await ws.send_text(json.dumps({"partial": partial}))

    # On close, summarize
    transcript = " ".join(full_text)
    summary = await summarizer.summarize(transcript)
    # Persist
    record = supabase.table("lectures").insert({
        "user_id": ws.query_params.get("user_id"),
        "transcript": transcript,
        "summary": summary
    }).execute()
    await ws.send_text(json.dumps({"summary": summary}))
    await ws.close()