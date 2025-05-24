import json
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .stt import STTClient
from .summarizer import Summarizer
from .db import supabase

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
async def websocket_transcribe(ws: WebSocket):
    """
    Handles streaming audio from client, returns live partials and final summary.
    Query param: user_id
    """
    await ws.accept()

    async def audio_gen():
        try:
            while True:
                data = await ws.receive_bytes()
                yield {'buffer': data}
        except Exception:
            return

    full_transcript_parts = []

    # Stream STT and send live captions
    async for partial in stt_client.stream_transcribe(audio_gen()):
        full_transcript_parts.append(partial)
        await ws.send_text(json.dumps({"partial": partial}))

    print(full_transcript_parts)

    # Assemble full transcript
    transcript = " ".join(full_transcript_parts)

    print(transcript)

    # Summarize
    summary = await summarizer.summarize(transcript)

    # Persist to Supabase
    supabase.table("lectures").insert({
        "user_id": ws.query_params.get("user_id"),
        "transcript": transcript,
        "summary": summary
    }).execute()

    # Send final summary and close
    await ws.send_text(json.dumps({"summary": summary}))
    await ws.close()