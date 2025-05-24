from deepgram import Deepgram
import asyncio

class STTClient:
    def __init__(self, api_key: str):
        self.dg_client = Deepgram(api_key)

    async def stream_transcribe(self, audio_generator):
        # audio_generator yields raw audio chunks
        # returns async iterator of partial transcripts
        response = await self.dg_client.transcription.live(
            {'punctuate': True},
            audio_generator
        )
        async for message in response:
            if 'channel' in message and message['channel'] == 'transcript':
                yield message['alternatives'][0]['transcript']