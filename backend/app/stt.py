import asyncio
from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents

class STTClient:
    def __init__(self, api_key: str):
        self.deepgram = DeepgramClient(api_key)
        self._q = asyncio.Queue()
        self._connection = None

    def _on_open(self, connection, open):
        print(f"Connection opened: {open}")

    def _on_message(self, connection, result):
        sentence = result.channel.alternatives[0].transcript
        if len(sentence) > 0:
            self._q.put_nowait(sentence)

    def _on_metadata(self, connection, metadata):
        print(f"Metadata received: {metadata}")

    def _on_speech_started(self, connection, speech_started):
        print(f"Speech started: {speech_started}")

    def _on_utterance_end(self, connection, utterance_end):
        print(f"Utterance ended: {utterance_end}")

    def _on_error(self, connection, error):
        error_msg = f"Error occurred: {error}"
        print(error_msg)
        self._q.put_nowait(f"ERROR: {error}")

    def _on_close(self, connection, close):
        print(f"Connection closed: {close}")
        self._q.put_nowait(None)  # Signal end of stream

    async def stream_transcribe(self, audio_generator):
        try:
            # Initialize connection with versioning
            self._connection = self.deepgram.listen.websocket.v("1")
            
            # Register all event handlers
            self._connection.on(LiveTranscriptionEvents.Open, self._on_open)
            self._connection.on(LiveTranscriptionEvents.Transcript, self._on_message)
            self._connection.on(LiveTranscriptionEvents.Metadata, self._on_metadata)
            self._connection.on(LiveTranscriptionEvents.SpeechStarted, self._on_speech_started)
            self._connection.on(LiveTranscriptionEvents.UtteranceEnd, self._on_utterance_end)
            self._connection.on(LiveTranscriptionEvents.Error, self._on_error)
            self._connection.on(LiveTranscriptionEvents.Close, self._on_close)

            # Configure options
            options = LiveOptions(
                model="nova-3",
                punctuate=True,
                language="en-US",
                encoding="linear16",
                channels=1,
                sample_rate=16000,
                interim_results=True,
                utterance_end_ms="1000",
                vad_events=True,
            )

            # Start the connection
            self._connection.start(options)

            # Process audio stream
            async for chunk in audio_generator:
                if self._connection:
                    self._connection.send(chunk["buffer"])
                    # Yield any transcripts that have been queued
                    while not self._q.empty():
                        transcript = self._q.get_nowait()
                        if transcript is None:  # Connection closed
                            return
                        if transcript.startswith("ERROR:"):  # Error occurred
                            raise Exception(transcript)
                        yield transcript

        except Exception as e:
            print(f"Error in stream_transcribe: {str(e)}")
            raise

        finally:
            await self._cleanup()

    async def _cleanup(self):
        if self._connection:
            try:
                self._connection.finish()
                self._connection = None
            except Exception as e:
                print(f"Error during cleanup: {str(e)}")