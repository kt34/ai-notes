import json
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
from starlette.websockets import WebSocketDisconnect
from .config import settings
from .stt import STTClient
from .summarizer import Summarizer
from .db import supabase
import asyncio

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
    await ws.accept()
    full_transcript_parts = []
    
    try:
        audio_buffer = []

        async def audio_gen():
            """Buffer audio for full processing even if client disconnects"""
            while True:
                try:
                    data = await asyncio.wait_for(ws.receive_bytes(), timeout=5)
                    audio_buffer.append(data)
                    yield {'buffer': data}
                except (asyncio.TimeoutError, WebSocketDisconnect):
                    # Send buffered audio to Deepgram
                    for chunk in audio_buffer:
                        yield {'buffer': chunk}
                    return

        # Process audio stream
        async for partial in stt_client.stream_transcribe(audio_gen()):
            full_transcript_parts.append(partial)
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(json.dumps({"partial": partial}))
            except RuntimeError:
                print("Could not send partial, connection might be closed")
        
        # Final processing
        transcript = " ".join(full_transcript_parts)
        if not transcript.strip():
            print("No transcript generated")
            return

        print("Transcript: " + transcript)

        try:
            # Generate summary
            summary = summarizer.summarize(transcript)
            print("\nChatGPT Summary: " + summary)

            # Store in DB
            supabase.table("lectures").insert({
                "user_id": ws.query_params.get("user_id"),
                "transcript": transcript,
                "summary": summary
            }).execute()
            
            # Ensure summary is sent if connection is still open
            if ws.client_state == WebSocketState.CONNECTED:
                try:
                    await ws.send_text(json.dumps({
                        "summary": summary,
                        "transcript": transcript  # Send both summary and full transcript
                    }))
                    print("Summary sent successfully")
                except Exception as e:
                    print(f"Failed to send summary: {str(e)}")
            else:
                print("Client disconnected, couldn't send summary")

        except Exception as e:
            print(f"Error in summary generation or database storage: {str(e)}")
            if ws.client_state == WebSocketState.CONNECTED:
                await ws.send_text(json.dumps({
                    "error": "Failed to generate summary"
                }))
            
    except WebSocketDisconnect:
        print("Client disconnected normally")
    except Exception as e:
        print(f"Error: {str(e)}")
        if ws.client_state == WebSocketState.CONNECTED:
            await ws.send_text(json.dumps({
                "error": str(e)
            }))
    finally:
        # Safely close connection if needed
        try:
            if (ws.application_state != WebSocketState.DISCONNECTED and 
                ws.client_state != WebSocketState.DISCONNECTED):
                print("Closing Connection Safely")
                await ws.close(code=1000)
        except RuntimeError as e:
            if "Unexpected ASGI message" not in str(e):
                raise