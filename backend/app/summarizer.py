import os
from openai import OpenAI

class Summarizer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def summarize(self, transcript: str) -> str:
        if not transcript.strip():
            return "No transcript provided to summarize."
            
        prompt = (
            "Generate concise lecture notes from the following transcript:\n\n" + transcript
        )
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in summarization: {str(e)}")
            return f"Error generating summary: {str(e)}"