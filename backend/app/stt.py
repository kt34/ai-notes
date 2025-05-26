# backend/app/stt.py
import asyncio
import inspect # For debugging
from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents

class STTClient:
    def __init__(self, api_key: str):
        self.deepgram = DeepgramClient(api_key)
        self._current_q: asyncio.Queue = None

    # --- Event Handlers ---
    def _on_open(self, dg_connection_instance, open_event):
        print(f"STTClient CB: Deepgram Connection opened: {open_event}")

    def _on_message(self, dg_connection_instance, result):
        if self._current_q is None:
            return

        transcript = ""
        if result.channel and result.channel.alternatives and len(result.channel.alternatives) > 0:
            transcript = result.channel.alternatives[0].transcript
        
        is_really_final = result.is_final or getattr(result, 'speech_final', False)
        # With interim_results=True, we get many messages. We primarily want to pass
        # non-empty transcripts to the main handler. The main handler in main.py
        # will then decide what to do with them (e.g., send partials to client).
        if transcript and len(transcript.strip()) > 0:
            try:
                # Add a flag or structure if you need to distinguish interim vs final in main.py
                # For now, just sending the transcript string.
                self._current_q.put_nowait(transcript) 
                # if is_really_final:
                #     print(f"STTClient CB (_on_message): Queued FINAL transcript: '{transcript[:30]}...'")
                # else:
                #     print(f"STTClient CB (_on_message): Queued INTERIM transcript: '{transcript[:30]}...'")

            except asyncio.QueueFull:
                print(f"STTClient CB (_on_message): Deepgram message queue full. Transcript '{transcript[:30]}...' lost.")
        # elif is_really_final and not transcript:
            # print("STTClient CB (_on_message): is_final event with empty transcript.")


    def _on_metadata(self, dg_connection_instance, metadata):
        print(f"STTClient CB: Deepgram Metadata received: {metadata}")

    def _on_speech_started(self, dg_connection_instance, speech_started):
        print(f"STTClient CB: Deepgram Speech started: {speech_started}")

    def _on_utterance_end(self, dg_connection_instance, utterance_end):
        print(f"STTClient CB: Deepgram Utterance ended: {utterance_end}")

    def _on_error(self, dg_connection_instance, error):
        error_message = str(error)
        if hasattr(error, 'message') and error.message:
            error_message = str(error.message)
        elif isinstance(error, dict) and 'message' in error:
            error_message = str(error['message'])
        
        print(f"STTClient CB: Deepgram Error occurred: {error_message}")
        if self._current_q is None: return
        try:
            self._current_q.put_nowait(f"ERROR: Deepgram - {error_message}")
        except asyncio.QueueFull:
            print("STTClient CB (_on_error): Deepgram error queue full. Error notification lost.")

    def _on_close(self, dg_connection_instance, close_event):
        print(f"STTClient CB: Deepgram Connection closed: {close_event}")
        if self._current_q is None: return
        try:
            self._current_q.put_nowait(None)
        except asyncio.QueueFull:
            print("STTClient CB (_on_close): Deepgram close signal queue full. End signal lost.")

    async def stream_transcribe(self, audio_generator):
        self._current_q = asyncio.Queue(maxsize=200) # Slightly larger queue for interim results
        dg_connection = None 
        
        try:
            dg_connection = self.deepgram.listen.live.v("1")

            dg_connection.on(LiveTranscriptionEvents.Open, self._on_open)
            dg_connection.on(LiveTranscriptionEvents.Transcript, self._on_message)
            dg_connection.on(LiveTranscriptionEvents.Metadata, self._on_metadata)
            dg_connection.on(LiveTranscriptionEvents.SpeechStarted, self._on_speech_started)
            dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, self._on_utterance_end)
            dg_connection.on(LiveTranscriptionEvents.Error, self._on_error)
            dg_connection.on(LiveTranscriptionEvents.Close, self._on_close)

            options = LiveOptions(
                model="nova-2",
                punctuate=True, language="en-US",
                encoding="linear16", channels=1, sample_rate=16000,
                interim_results=True, # <<<< REVERTED TO TRUE
                utterance_end_ms="1000", vad_events=True,
                smart_format=True 
            )
            
            print(f"STTClient: Attempting to start Deepgram connection with options: {options}")
            start_result = dg_connection.start(options) 
            
            if not start_result:
                print("STTClient: Deepgram dg_connection.start() returned False.")
                if self._current_q: self._current_q.put_nowait(None)
                raise ConnectionError("Failed to start Deepgram connection (start returned False)")
            
            print("STTClient: Deepgram connection start() called successfully.")

            async for chunk_dict in audio_generator:
                if dg_connection:
                    try:
                        dg_connection.send(chunk_dict["buffer"])
                    except Exception as send_error:
                        print(f"STTClient: Error sending data: {type(send_error).__name__} - {send_error}.")
                        if self._current_q: self._current_q.put_nowait(None)
                        break 
                else:
                    print("STTClient: No dg_connection to send to. Breaking send loop.")
                    if self._current_q: self._current_q.put_nowait(None)
                    break 
                
                while not self._current_q.empty():
                    item = self._current_q.get_nowait() 
                    if item is None:
                        print("STTClient: (Send Loop) Got None from queue. Early termination of stream.")
                        if dg_connection: dg_connection.finish()
                        return 
                    if isinstance(item, str) and item.startswith("ERROR:"):
                        print(f"STTClient: (Send Loop) Propagating error: {item}")
                        raise Exception(item)
                    # Yield all non-empty strings (interim or final transcripts)
                    if isinstance(item, str) and item.strip():
                        yield item

            print("STTClient: Audio generator finished.")

            if dg_connection:
                print("STTClient: Signaling Deepgram to finish (calling .finish()).")
                finish_success = dg_connection.finish() 
                if finish_success:
                    print("STTClient: dg_connection.finish() called. Waiting for final queue items.")
                else:
                    print("STTClient: dg_connection.finish() returned False.")
            
            print("STTClient: Draining queue after finish().")
            processed_after_finish = 0
            while True:
                try:
                    item = await asyncio.wait_for(self._current_q.get(), timeout=20.0)
                    processed_after_finish +=1
                except asyncio.TimeoutError:
                    print(f"STTClient: Timeout draining queue after finish (processed {processed_after_finish} items).")
                    break 
                except asyncio.QueueEmpty:
                    print(f"STTClient: Queue empty draining after finish (processed {processed_after_finish} items).")
                    break

                if item is None: 
                    print(f"STTClient: Got None from queue after finish (processed {processed_after_finish} items). End of stream.")
                    break 
                if isinstance(item, str) and item.startswith("ERROR:"):
                    print(f"STTClient: (Drain Loop) Propagating error: {item}")
                    raise Exception(item) 
                if isinstance(item, str) and item.strip(): # Yield any remaining transcripts
                    yield item
            
            print(f"STTClient: Finished draining queue (processed {processed_after_finish} items in drain loop).")

        except ConnectionError as ce:
            print(f"STTClient: ConnectionError: {ce}")
            if self._current_q and not self._current_q.full(): self._current_q.put_nowait(None)
            raise 
        except Exception as e:
            print(f"STTClient: General error: {type(e).__name__} - {str(e)}")
            if self._current_q and not self._current_q.full(): self._current_q.put_nowait(None) 
            raise
        finally:
            print("STTClient: Outer finally block.")
            if self._current_q:
                if self._current_q.empty():
                    try: self._current_q.put_nowait(None)
                    except: pass 
            self._current_q = None 
            print("STTClient: stream_transcribe fully finished.")