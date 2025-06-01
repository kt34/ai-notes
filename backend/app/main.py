import json
from fastapi import FastAPI, WebSocket, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
from starlette.websockets import WebSocketDisconnect
from .config import settings
from .stt import STTClient
from .summarizer import Summarizer
from .db import supabase, get_user_lectures
from .auth import UserCreate, UserLogin, register_user, login_user, logout_user, get_current_user, get_authenticated_user_from_header, SupabaseUser
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

# Auth endpoints
@app.post("/auth/register")
async def register(user_data: UserCreate):
    try:
        return await register_user(user_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(user_data: UserLogin):
    try:
        return await login_user(user_data)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/auth/logout")
async def logout():
    try:
        return logout_user()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/auth/me", response_model=SupabaseUser) # Assuming SupabaseUser is the model for the user object
async def read_users_me(current_user: SupabaseUser = Depends(get_authenticated_user_from_header)):
    # current_user is now the authenticated Supabase user object
    return current_user

@app.get("/lectures")
async def get_lectures(current_user: SupabaseUser = Depends(get_authenticated_user_from_header)):
    try:
        user_id = current_user.id
        lectures_data = get_user_lectures(user_id)
        return lectures_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lectures/{lecture_id}")
async def get_lecture(lecture_id: str, current_user: SupabaseUser = Depends(get_authenticated_user_from_header)):
    try:
        # Query the specific lecture and ensure it belongs to the current user
        response = supabase.table("lectures").select("*").eq("id", lecture_id).eq("user_id", current_user.id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Lecture not found")
            
        return response.data[0]
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    try:
        # Use the refresh token to get a new access token
        response = supabase.auth.refresh_session(refresh_token)
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.websocket("/ws/transcribe")
async def websocket_transcribe(ws: WebSocket):
    await ws.accept()
    
    try:

        token = ws.query_params.get("token")
        if not token:
            raise WebSocketException(code=4001, reason="Missing authentication token")

        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise WebSocketException(code=4001, reason="Invalid authentication token")

        user_id = user_response.user.id

        print(f"User {user_id} connected for transcription.")
        
        # audio_buffer_for_full_transcript was not used, removed
        audio_buffer = []
        
        first_chunk_received = False # To differentiate timeout before vs. after audio starts
        
        async def audio_gen():
            nonlocal first_chunk_received 
            try:
                while True: # Loop until explicitly broken
                    if ws.client_state != WebSocketState.CONNECTED:
                        print("audio_gen: WebSocket no longer connected. Stopping.")
                        break
                    try:
                        # Timeout to detect when client stops sending audio
                        # or when client sends an empty byte string as an explicit end signal
                        data = await asyncio.wait_for(ws.receive_bytes(), timeout=5.0) # Increased timeout slightly
                        
                        if not data: # Client explicitly sent empty bytes (0-length)
                            print("audio_gen: Received empty bytes from client. Ending audio stream.")
                            break
                        
                        first_chunk_received = True
                        # audio_buffer_for_full_transcript.append(data) # If needed for other purposes
                        yield {'buffer': data}

                    except asyncio.TimeoutError:
                        if first_chunk_received:
                            print("audio_gen: Timeout after receiving audio. Assuming client stopped sending.")
                            break # End of audio from client
                        else:
                            print("audio_gen: Timeout, no audio received yet. Client might be idle or setting up. Continuing to wait.")
                            # Optionally, implement a max idle timeout here if desired
                            continue 
                    except WebSocketDisconnect:
                        print("audio_gen: WebSocket disconnected during receive_bytes.")
                        break # Exit generator
                    except RuntimeError as e: # Handles cases like "Cannot call receive_bytes after connection is closed"
                        if "after connection is closed" in str(e):
                            print(f"audio_gen: WebSocket receive_bytes error after close: {e}")
                        else:
                            print(f"audio_gen: Runtime error during receive_bytes: {e}")
                        break
            finally:
                print("audio_gen: Finished generating audio.")

        final_transcript_segments = []
        last_processed_stt_text = "" # Track the very last text from STT (interim or final)

        # Process audio stream from STTClient
        async for stt_event in stt_client.stream_transcribe(audio_gen()):
            if ws.client_state != WebSocketState.CONNECTED:
                print("WebSocket disconnected while receiving partials. Breaking.")
                break 

            transcript_text = stt_event.get("text", "")
            is_speech_final = stt_event.get("is_speech_final", False)

            if not transcript_text.strip(): # Skip if empty text
                continue

            last_processed_stt_text = transcript_text # Update with every non-empty text

            try:
                await ws.send_text(json.dumps({
                    "text": transcript_text,
                    "is_final_utterance_segment": is_speech_final
                }))
            except Exception as send_err:
                print(f"Error sending partial transcript: {send_err}. Client might have disconnected.")
                break # Stop processing if we can't send to client
            
            if is_speech_final:
                final_transcript_segments.append(transcript_text)
        
        print("Finished iterating stt_client.stream_transcribe.")

        # Construct the final transcript for OpenAI and database
        built_transcript_from_finals = " ".join(final_transcript_segments).strip()
        transcript = built_transcript_from_finals

        if not transcript: # if built_transcript_from_finals is empty
            if last_processed_stt_text:
                transcript = last_processed_stt_text
            elif first_chunk_received:
                 transcript = "No speech detected in audio"
            else:
                transcript = "Session ended prematurely or no audio sent."

        elif final_transcript_segments and last_processed_stt_text and \
             last_processed_stt_text.startswith(final_transcript_segments[-1]) and \
             len(last_processed_stt_text) > len(final_transcript_segments[-1]):
            # This condition aims to catch if the audio cut off mid-utterance after the last speech_final event.
            # It checks if the last_processed_stt_text (which could be an interim) is a continuation
            # of the last recognized final segment.
            final_transcript_segments[-1] = last_processed_stt_text # Update the last final segment to be more complete
            transcript = " ".join(final_transcript_segments).strip()
        
        print("Full Transcript for OpenAI: " + transcript)

        summary = "Summary could not be generated for this session." # Default summary

        try:
            # Generate summary
            summary = summarizer.summarize(transcript) # This can take time
            print("\nChatGPT Full Summary: " + summary)

            structured_summary_data = summarizer.parse_structured_summary(summary)
            print("\nParsed Structured Summary Data:\n", structured_summary_data)

            # Store in DB
            # Define conditions for not storing, e.g., very short or error messages
            skippable_transcripts = [
                "No speech detected in audio", 
                "Session ended prematurely or no audio sent."
            ]
            # Also consider not storing if summary indicates an error.
            if transcript.strip() and transcript not in skippable_transcripts and "Error generating summary" not in summary:
                # Extract a title from the first sentence or first N words
                
                lecture_data_to_insert = {
                    "user_id": user_id,
                    "transcript": transcript,
                    "summary": summary, 
                    "lecture_title": structured_summary_data.get("lecture_title"),
                    "topic_summary_sentence": structured_summary_data.get("topic_summary_sentence"),
                    "key_concepts": structured_summary_data.get("key_concepts"), # This will be a list or []
                    "main_points_covered": structured_summary_data.get("main_points_covered"), # This will be a list or []
                    "examples_mentioned": structured_summary_data.get("examples_mentioned"), # This will be a list or []
                    "important_quotes": structured_summary_data.get("important_quotes"), # Still text, or list if you changed it
                    "conclusion_takeaways": structured_summary_data.get("conclusion_takeaways"), # Still text
                    "references": structured_summary_data.get("references"), # This will be a list or []
                }

                db_response = supabase.table("lectures").insert(lecture_data_to_insert).execute()
                print(f"Data insertion response: {db_response}")
            else:
                print(f"Skipping DB insert for transcript: '{transcript}' or due to summary error.")

            # Ensure summary and full transcript are sent if connection is still open
            if ws.client_state == WebSocketState.CONNECTED:
                try:
                    await ws.send_text(json.dumps({
                        "summary": summary,
                        "transcript": transcript 
                    }))
                    print("Summary and final transcript sent successfully.")
                except Exception as e:
                    print(f"Failed to send summary/final transcript: {str(e)}")
            else:
                print("Client disconnected, couldn't send summary/final transcript.")

        except Exception as e:
            print(f"Error in summary generation or database storage: {str(e)}")
            # Try to send an error message to the client if still connected
            if ws.client_state == WebSocketState.CONNECTED:
                try:
                    await ws.send_text(json.dumps({
                        "error": "Failed to generate summary or store data.",
                        "transcript": transcript # Send transcript even if summary fails
                    }))
                except Exception as send_err:
                    print(f"Failed to send error message to client: {send_err}")
            
    except WebSocketDisconnect:
        print(f"Client disconnected from FastAPI WebSocket: {ws.client_state}, {ws.application_state}")
    except Exception as e:
        print(f"Unhandled error in websocket_transcribe: {str(e)}")
        if ws.client_state == WebSocketState.CONNECTED:
            try:
                await ws.send_text(json.dumps({"error": f"An unexpected server error occurred: {str(e)}"}))
            except Exception as send_err:
                print(f"Error sending unhandled error to client: {send_err}")
    finally:
        print("FastAPI WebSocket handler: Attempting to clean up WebSocket.")
        if ws.client_state != WebSocketState.DISCONNECTED:
            try:
                await ws.close(code=1000) 
                print("FastAPI WebSocket closed in finally block.")
            except RuntimeError as e:
                # Handle cases where close() is called on an already closing/closed socket
                print(f"RuntimeError during WebSocket close: {e}. Connection state: {ws.client_state}")
            except Exception as e:
                print(f"Unexpected error during WebSocket close: {e}")
        else:
            print("FastAPI WebSocket already disconnected.")

@app.get("/user/stats")
async def get_user_stats(current_user: SupabaseUser = Depends(get_authenticated_user_from_header)):
    try:
        # Get user's lectures
        response = supabase.table("lectures").select("*").eq("user_id", current_user.id).execute()
        lectures = response.data if response.data else []
        
        # Calculate total lectures and total minutes (assuming average of 5 minutes per lecture for now)
        total_lectures = len(lectures)
        total_minutes = total_lectures * 5  # This is a placeholder. You might want to store actual duration in your lectures table
        
        return {
            "total_lectures": total_lectures,
            "total_minutes": total_minutes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))