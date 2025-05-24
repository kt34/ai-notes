import os
from openai import OpenAI

class Summarizer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    async def summarize(self, transcript: str) -> str:
        prompt = (
            "Generate concise lecture notes from the following transcript:\n\n" + transcript
        )
        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return response.choices[0].message.content