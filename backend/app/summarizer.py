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
            "You are an expert academic note-taker, tasked with creating comprehensive study notes from a lecture transcript. Your primary goal is to capture the depth and nuance of the lecture for thorough understanding and exam preparation.\n\n"
            "Your task is to extract the key information and produce structured notes.\n\n"
            "Please organize the notes using the following EXACT section markers and instructions:\n\n"
            "@@LECTURE_TITLE_START@@\n"
            "[Infer an appropriate and concise lecture title. Always provide a title, even if it's a general topic derived from the content.]\n"
            "@@LECTURE_TITLE_END@@\n\n"

            "@@TOPIC_SUMMARY_START@@\n"
            "[Provide a brief, single-sentence summary that encapsulates the main theme of the lecture.]\n"
            "@@TOPIC_SUMMARY_END@@\n\n"

            "@@KEY_CONCEPTS_START@@\n"
            "[List key concepts and essential terminology as concise bullet points. Use standard markdown bullets '-'. Limit this section to a maximum of four key concepts. If none are distinct, state 'None'. These should be brief definitions or terms.]\n"
            "@@KEY_CONCEPTS_END@@\n\n"

            "@@MAIN_POINTS_START@@\n"
            "[This is a CRITICAL section. Summarize the main ideas presented in the lecture in the order they appear. Each bullet point using '-' MUST be detailed and comprehensive, potentially spanning multiple sentences to fully explain the idea, its implications, or context. Do NOT provide short, Vague phrases. Aim for explanations that would help someone thoroughly understand the topic without re-listening to the lecture. If no main points are discernible, state 'None'.]\n"
            "@@MAIN_POINTS_END@@\n\n"

            "@@EXAMPLES_MENTIONED_START@@\n"
            "[List any examples, case studies, or specific illustrations mentioned. Each bullet point using '-' should describe the example in sufficient detail to understand its relevance and how it supports a main point. These should be more than just a name; explain the example. If no examples are mentioned, state 'None'.]\n"
            "@@EXAMPLES_MENTIONED_END@@\n\n"

            "@@IMPORTANT_QUOTES_START@@\n"
            "[Extract any notable or directly quoted phrases or impactful statements from the instructor. Use standard markdown bullets '-'. If none, state 'None'.]\n"
            "@@IMPORTANT_QUOTES_END@@\n\n"

            "@@CONCLUSION_TAKEAWAYS_START@@\n"
            "[Write a short, yet comprehensive paragraph summarizing the main conclusions or key takeaways from the entire lecture. This should synthesize the most important information for a final review. This section should be a paragraph, not bullet points.]\n"
            "@@CONCLUSION_TAKEAWAYS_END@@\n\n"

            "@@OPTIONAL_REFERENCES_START@@\n"
            "[List any mentioned books, articles, websites, or further reading suggestions. Use standard markdown bullets '-'. If none, state 'None'.]\n"
            "@@OPTIONAL_REFERENCES_END@@\n\n"

            "General Note-Taking Style:\n"
            "- The notes, especially for 'Main Points' and 'Examples Mentioned', need to be sufficiently detailed for comprehensive review. Avoid overly terse points in these sections.\n"
            "- Ensure information is organized logically, following the lecture's flow where possible.\n"
            "- The overall tone should be academic and informative, suitable for exam revision.\n\n"

            "IMPORTANT FORMATTING REQUIREMENT: Even if the information for a section is minimal or the transcript seems empty, YOU MUST include all start and end markers (e.g., @@SECTION_START@@ and @@SECTION_END@@) for every section. Place 'Not available' or 'None' (as appropriate per section instructions) between the markers if applicable.\n\n"
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
