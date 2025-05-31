import os
from openai import OpenAI

class Summarizer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def summarize(self, transcript: str) -> str:
        if not transcript.strip():
            return "No transcript provided to summarize."
            
        prompt = (
            "You are an expert academic note-taker. I will provide you with a long lecture transcript.\n"
            "Your task is to extract the key information and produce clear, structured notes suitable for students.\n\n"
            "Please organize the notes with the following format:\n"
            "- Lecture Title: [If available or inferable]\n"
            "- Date/Topic Summary: [Brief one-sentence summary]\n"
            "- Key Concepts and Definitions: Bullet points of main ideas and terms\n"
            "- Main Points Covered: Use bullet points or numbered sections to summarize main ideas in order\n"
            "- Examples or Case Studies Mentioned: If any\n"
            "- Important Quotes or Explanations: If any notable phrases or instructor explanations stand out\n"
            "- Summary/Conclusion: A short paragraph summarizing the key takeaways\n"
            "- Optional References: Add relevant links to further reading or sources, if applicable\n\n"
            "Always return in this format, no matter even if the information is so minimal or the transcript seems empty, you need to return in this format\n\n"
            "Make sure the notes are:\n"
            "- Concise but informative\n"
            "- Easy to review later\n"
            "- Organized logically\n"
            "- Suitable for revising before an exam\n\n"
            "Here is the lecture transcript:\n\n"
            + transcript
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