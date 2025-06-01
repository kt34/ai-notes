import os
from openai import OpenAI
import re

class Summarizer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def summarize(self, transcript: str) -> str:
        if not transcript.strip():
            return "No transcript provided to summarize."
            
        prompt = (
            "You are an expert academic note-taker. I will provide you with a long lecture transcript.\n"
            "Your task is to extract the key information and produce structured notes.\n\n"
            "Please organize the notes using the following EXACT section markers:\n"
            "@@LECTURE_TITLE_START@@\n" # Using unique markers
            "[Inferrable lecture title, always provide some sort of title here]\n"
            "@@LECTURE_TITLE_END@@\n\n"
            "@@TOPIC_SUMMARY_START@@\n"
            "[Brief one-sentence summary]\n"
            "@@TOPIC_SUMMARY_END@@\n\n"
            "@@KEY_CONCEPTS_START@@\n"
            "[Bullet points of key concepts and terms. Use standard markdown bullets '-'. If none, state 'None']\n"
            "@@KEY_CONCEPTS_END@@\n\n"
            "@@MAIN_POINTS_START@@\n"
            "[Use bullet points to summarize main ideas in order. Use standard markdown bullets '-'. If none, state 'None']\n"
            "@@MAIN_POINTS_END@@\n\n"
            "@@EXAMPLES_MENTIONED_START@@\n"
            "[Use bullet points to list the excamples mentioned in order. Use standard markdown bullets '-'. If none, state 'None']\n"
            "@@EXAMPLES_MENTIONED_END@@\n\n"
            "@@IMPORTANT_QUOTES_START@@\n"
            "[If any notable phrases or instructor explanations stand out. Use standard markdown bullets '-'. If none, state 'None']\n"
            "@@IMPORTANT_QUOTES_END@@\n\n"
            "@@CONCLUSION_TAKEAWAYS_START@@\n"
            "[A short paragraph summarizing the key takeaways. If none, state 'None']\n"
            "@@CONCLUSION_TAKEAWAYS_END@@\n\n"
            "@@OPTIONAL_REFERENCES_START@@\n"
            "[Add relevant links to further reading or sources, if applicable. Use standard markdown bullets '-'. If none, state 'None']\n"
            "@@OPTIONAL_REFERENCES_END@@\n\n"
            "Make sure the notes are:\n"
            "- Concise but informative\n"
            "- Not super short, especially for the main points and examples mentioned and the conclusion takeaways, these can be much longer dot points with all relevant information this is the main bulk of the information\n"
            "- Easy to review later\n"
            "- Organized logically\n"
            "- Suitable for revising before an exam\n\n"
            "Even if the information for a section is minimal or the transcript seems empty, YOU MUST include all start and end markers (e.g., @@SECTION_START@@ and @@SECTION_END@@) for every section. Place 'Not available' or 'None' between the markers if applicable.\n\n"
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

    def parse_structured_summary(self, summary_text: str) -> dict:
        parsed_data = {}

        array_sections_keys = [
            "key_concepts", 
            "main_points_covered", 
            "examples_mentioned",
            "references",
            "important_quotes",
        ]

        sections = {
            "lecture_title": "LECTURE_TITLE",
            "topic_summary_sentence": "TOPIC_SUMMARY",
            "key_concepts": "KEY_CONCEPTS",
            "main_points_covered": "MAIN_POINTS",
            "examples_mentioned": "EXAMPLES_MENTIONED",
            "important_quotes": "IMPORTANT_QUOTES",
            "conclusion_takeaways": "CONCLUSION_TAKEAWAYS",
            "references": "OPTIONAL_REFERENCES",
        }

        for key, section_name in sections.items():
            start_marker = f"@@{section_name}_START@@"
            end_marker = f"@@{section_name}_END@@"
            
            # Regex to find content between markers, handling multiline content
            # re.DOTALL makes '.' match newlines as well
            match = re.search(f"{re.escape(start_marker)}(.*?){re.escape(end_marker)}", summary_text, re.DOTALL)
            if match:
                content = match.group(1).strip()
                # Handle cases where AI might explicitly say "None" or "Not available"
                if content.lower() in ["none", "not available", ""]:
                    parsed_data[key] = [] if key in array_sections_keys else None
                else:
                    if key in array_sections_keys:
                        # Split by newline, then strip whitespace and remove empty lines
                        # Also remove common bullet point markers like '-', '*', or '•'
                        lines = [
                            re.sub(r"^\s*[-*\u2022]\s*", "", line).strip() 
                            for line in content.splitlines() 
                            if line.strip() # Ensure line is not empty after stripping
                        ]
                        # Filter out any "None" or "Not available" that might be the only item after splitting
                        if len(lines) == 1 and lines[0].lower() in ["none", "not available"]:
                            parsed_data[key] = []
                        else:
                            parsed_data[key] = lines
                    else:
                        parsed_data[key] = content
            else:
                # If markers are not found, default to None or an empty string
                parsed_data[key] = [] if key in array_sections_keys else None
                print(f"Warning: Markers for section '{section_name}' not found in summary.")

        return parsed_data
