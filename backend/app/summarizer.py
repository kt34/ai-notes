import os
from openai import OpenAI
import re
import json

class Summarizer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def _split_transcript_into_sections(self, transcript: str, max_words_per_section: int = 500) -> list[str]:
        """Split transcript into sections based purely on word count."""
        print("\nDEBUG: Starting section splitting...")
        
        # Split into words and clean up
        words = transcript.split()
        total_words = len(words)
        print(f"DEBUG: Total words in transcript: {total_words}")
        
        # Split into sections of max_words_per_section
        sections = []
        for i in range(0, total_words, max_words_per_section):
            section = ' '.join(words[i:i + max_words_per_section])
            sections.append(section)
            print(f"DEBUG: Added section {len(sections)} with {len(words[i:i + max_words_per_section])} words")
        
        print(f"DEBUG: Final section count: {len(sections)}")
        if sections:
            avg_words = sum(len(section.split()) for section in sections) / len(sections)
            print(f"DEBUG: Average words per section: {avg_words:.1f}")
            
        return sections

    def _generate_section_summary(self, section: str, section_number: int, total_sections: int) -> dict:
        """Generate a summary for a single section of the transcript."""
        prompt = (
            f"You are analyzing section {section_number} of {total_sections} from a lecture transcript.\n"
            "Create a concise summary of this section that includes:\n"
            "1. The main topics or concepts discussed\n"
            "2. Any key points or arguments made\n"
            "3. Notable examples or illustrations used\n\n"
            "Format the response as a JSON object with these fields:\n"
            "- timestamp_marker: A text marker indicating this is section {section_number} of {total_sections}\n"
            "- main_topics: A list of 1-3 main topics covered in this section\n"
            "- key_points: A list of the most important points made\n"
            "- examples: Any specific examples mentioned (or null if none)\n"
            "- summary: A 2-3 sentence summary of this section\n\n"
            "Here is the section text:\n\n"
            f"{section}"
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={ "type": "json_object" }
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error generating section summary: {str(e)}")
            return {
                "timestamp_marker": f"Section {section_number} of {total_sections}",
                "main_topics": [],
                "key_points": [],
                "examples": None,
                "summary": f"Error generating summary for section {section_number}: {str(e)}"
            }

    def summarize(self, transcript: str) -> str:
        if not transcript.strip():
            return "No transcript provided to summarize."
            
        # Generate section summaries first
        sections = self._split_transcript_into_sections(transcript)
        section_summaries = []
        
        print(f"\nGenerating summaries for {len(sections)} sections...")
        for i, section in enumerate(sections, 1):
            print(f"Generating summary for section {i}/{len(sections)}...")
            section_summary = self._generate_section_summary(section, i, len(sections))
            section_summaries.append(section_summary)
        print("All section summaries generated.")

        # Generate the main summary without section summaries in the prompt
        overall_prompt = (
            "You are an expert academic note-taker, tasked with creating comprehensive study notes from a lecture transcript. "
            "Your primary goal is to capture the depth and nuance of the lecture for thorough understanding and exam preparation.\n\n"
            "Your task is to extract the key information and produce structured notes.\n\n"
            "Please organize the notes using the following EXACT section markers and instructions:\n\n"
            "@@LECTURE_TITLE_START@@\n"
            "[Infer an appropriate and concise lecture title. Always provide a title, even if it's a general topic derived from the content.]\n"
            "@@LECTURE_TITLE_END@@\n\n"
            "@@TOPIC_SUMMARY_START@@\n"
            "[Provide a brief, single-sentence summary that encapsulates the main theme of the lecture.]\n"
            "@@TOPIC_SUMMARY_END@@\n\n"
            "@@KEY_CONCEPTS_START@@\n"
            "[List key concepts as concise bullet points. Each key concept can only be a maximum of three words. Use standard markdown bullets '-'. Limit this section to a maximum of four key concepts. If none are distinct, state 'None'. These should be brief definitions or terms.]\n"
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
            "[Provide references in the following format. Each reference MUST be a single line starting with '-' and MUST contain an actual, working URL (not placeholder text):\n\n"
            "For academic papers:\n"
            "- https://doi.org/[doi-number]\n\n"
            "For online resources:\n"
            "- https://[exact-url]\n\n"
            "Example format:\n"
            "- https://www.investopedia.com/terms/m/modernportfoliotheory.asp\n\n"
            "Remember:\n"
            "1. Each URL must be a real, working URL (not a placeholder)\n"
            "2. Include both mentioned sources and recommended reading\n"
            "3. If no references were mentioned, provide at least 2-3 relevant recommended resources with actual URLs\n"
            "4. Do not use markdown link syntax [...](...)]\n"
            "@@OPTIONAL_REFERENCES_END@@\n\n"
            "Here is the lecture transcript:\n\n"
            f"{transcript}"
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": overall_prompt}],
                temperature=0.3,
            )
            summary_text = response.choices[0].message.content

            # Add section summaries to the summary text
            section_summaries_json = json.dumps(section_summaries, indent=2)
            summary_text = summary_text.rstrip() + "\n\n@@SECTION_SUMMARIES_START@@\n" + section_summaries_json + "\n@@SECTION_SUMMARIES_END@@\n"
            
            return summary_text
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
            "section_summaries"
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
            "section_summaries": "SECTION_SUMMARIES"
        }

        # First, try to extract section summaries specifically
        section_summaries_match = re.search(r"@@SECTION_SUMMARIES_START@@\s*(.*?)\s*@@SECTION_SUMMARIES_END@@", summary_text, re.DOTALL)
        if section_summaries_match:
            try:
                section_summaries_content = section_summaries_match.group(1).strip()
                if section_summaries_content and section_summaries_content.lower() not in ["none", "not available"]:
                    parsed_data["section_summaries"] = json.loads(section_summaries_content)
                    print(f"Successfully parsed {len(parsed_data['section_summaries'])} section summaries")
                else:
                    parsed_data["section_summaries"] = []
                    print("No section summaries content found between markers")
            except json.JSONDecodeError as e:
                print(f"Error parsing section summaries JSON: {e}")
                print("Raw section summaries content:", section_summaries_content)
                parsed_data["section_summaries"] = []
        else:
            print("Section summaries markers not found in text")
            parsed_data["section_summaries"] = []

        # Then parse the rest of the sections
        for key, section_name in sections.items():
            if key == "section_summaries":
                continue  # Already handled above
                
            start_marker = f"@@{section_name}_START@@"
            end_marker = f"@@{section_name}_END@@"
            
            match = re.search(f"{re.escape(start_marker)}(.*?){re.escape(end_marker)}", summary_text, re.DOTALL)
            if match:
                content = match.group(1).strip()
                if content.lower() in ["none", "not available", ""]:
                    parsed_data[key] = [] if key in array_sections_keys else None
                else:
                    if key in array_sections_keys:
                        lines = [
                            re.sub(r"^\s*[-*\u2022]\s*", "", line).strip() 
                            for line in content.splitlines() 
                            if line.strip()
                        ]
                        if len(lines) == 1 and lines[0].lower() in ["none", "not available"]:
                            parsed_data[key] = []
                        else:
                            parsed_data[key] = lines
                    else:
                        parsed_data[key] = content
            else:
                parsed_data[key] = [] if key in array_sections_keys else None
                print(f"Warning: Markers for section '{section_name}' not found in summary.")

        return parsed_data
