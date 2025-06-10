import os
from openai import AsyncOpenAI
import re
import json
import asyncio

class Summarizer:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

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

    async def _generate_section_summary(self, section: str, section_number: int, total_sections: int) -> dict:
        """Generate a summary for a single section of the transcript."""
        prompt = (
            f"You are a student-focused AI assistant analyzing section {section_number} of {total_sections} of a lecture transcript. "
            "Your goal is to create a concise, structured summary that helps a student digest this specific part of the lecture. "
            "The summary should be distinct from a simple transcript reduction and focus on actionable learning points.\n\n"
            "Format the response as a JSON object with the following fields and STRICT constraints:\n"
            "- section_title: A very short, descriptive title for this section (e.g., 'Introduction to Photosynthesis'). MUST be a string.\n"
            "- key_takeaways: A list of 2-3 of the most critical concepts or conclusions as STRINGS. You must return at least 2 key takeaways. Each string MUST be a complete sentence. If none, return an empty list.\n"
            "- new_vocabulary: A list of 1-4 new important keywords or technical terms as STRINGS. Ensure they are capitalized. If none, return an empty list.\n"
            "- study_questions: A list of 1-2 pointed questions as STRINGS that a student should be able to answer after this section. This promotes active recall.\n"
            "- examples: A list of 1-2 specific examples, analogies, real-world references, or illustrative scenarios mentioned in this section. These may include brief illustrative phrases. You must return at least 2 examples. If none, return an empty list.\n\n"
            "- useful_references: You are an academic assistant helping students by providing useful, trustworthy reference links based on the lecture transcript below.\n\n🔗 Your task:\n- You MUST provide 2 real, working URLs** relevant to the lecture content.\n- These can include:  \n  • Sources directly mentioned in the transcript (if any)  \n  • Recommended readings: academic articles, videos, or educational web resources  \n\n🎯 Reference Guidelines:\n- Return up to **2 references** as a **JSON array of objects**\n- Each object must contain:  \n  • \"title\" - a short, clear name of the resource (string)  \n  • \"url\" - a real, working URL (string)\n- Example format:\n[\n  { \"title\": \"Modern Portfolio Theory (MPT)\", \"url\": \"https://www.investopedia.com/terms/m/modernportfoliotheory.asp\" },\n  { \"title\": \"Efficient Frontier Explained\", \"url\": \"https://www.khanacademy.org/economics-finance-domain/core-finance/investment-vehicles-tutorial/modern-portfolio-theory/v/efficient-frontier\" }\n]\n- DO NOT use markdown link syntax (e.g., `[title](url)`)\n- DO NOT include any commentary or formatting outside the JSON array\n- If no references are found, return an empty array: `[]`\n\n🎓 Preferred Sources (if applicable):\n- Academic domains like `.edu`, `.org`, `https://doi.org/`, or trusted sources like:  \n  Google Scholar, PubMed, Khan Academy, MIT OpenCourseWare, Stanford Encyclopedia of Philosophy, etc.\n\n📌 If no sources were mentioned in the transcript:\n- Still provide 2 highly relevant resources  \n- At least 1-2 should be high-quality academic or educational URLs based on the topic\n"
            "Respond ONLY with the JSON object. Do not include any other text or formatting.\n\n"
            "Here is the section text:\n\n"
            f"{section}"
        )

        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4, # Slightly increased for more creative questions/links
                response_format={ "type": "json_object" }
            )
            print(f"Response: {response.choices[0].message.content}")
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error generating section summary: {str(e)}")
            return {
                "section_title": f"Section {section_number}",
                "key_takeaways": [],
                "new_vocabulary": [],
                "study_questions": [],
                "examples": [],
                "useful_references": []
            }

    async def summarize(self, transcript: str) -> str:
        if not transcript.strip():
            return "No transcript provided to summarize."
            
        # Generate section summaries first, concurrently
        sections = self._split_transcript_into_sections(transcript)
        
        print(f"\nGenerating summaries for {len(sections)} sections concurrently...")
        tasks = []
        for i, section in enumerate(sections, 1):
            tasks.append(self._generate_section_summary(section, i, len(sections)))
        
        section_summaries = await asyncio.gather(*tasks)
        print("All section summaries generated.")

        # Generate the main summary without section summaries in the prompt
        overall_prompt = (
            "You are an expert academic note-taker, tasked with creating comprehensive study notes from a lecture transcript. "
            "Your primary goal is to capture the depth and nuance of the lecture for thorough understanding and exam preparation.\n\n"
            "Your task is to extract the key information and produce structured notes.\n\n"
            "Please organize the notes using the following EXACT section markers and instructions:\n\n"
            "@@LECTURE_TITLE_START@@\n"
            "[Based on the *entire lecture transcript* provided, infer a clear and concise title that accurately captures the main theme or subject. Do not base the title on individual sections alone.]\n"
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
            "@@CONCLUSION_TAKEAWAYS_START@@\n"
            "[Write a short, yet comprehensive paragraph summarizing the main conclusions or key takeaways from the entire lecture. This should synthesize the most important information for a final review. This section should be a paragraph, not bullet points.]\n"
            "@@CONCLUSION_TAKEAWAYS_END@@\n\n"
            "@@STUDY_QUESTIONS_START@@\n"
            "[List 5-10 high-level study questions that cover the main topics of the entire lecture. You must provide at least 5 questions. Each question should be a string. If none, state 'None'.]\n"
            "@@STUDY_QUESTIONS_END@@\n\n"
            "@@FLASHCARDS_START@@\n"
            "[Generate between 10 and 20 flashcards as a JSON array of objects. Each object must have a 'question' and 'answer' field. "
            "Example: [{\"question\": \"Q1\", \"answer\": \"A1\"}, {\"question\": \"Q2\", \"answer\": \"A2\"}]. "
            "If no relevant flashcards can be generated, return an empty array [].]\n"
            "@@FLASHCARDS_END@@\n\n"
            "@@OPTIONAL_REFERENCES_START@@\n"
            "[You are an academic assistant helping students by providing useful, trustworthy reference links based on the lecture transcript below.\n\n🔗 Your task:\n- Provide **at least 5 real, working URLs** relevant to the lecture content.\n- These can include:  \n  • Sources directly mentioned in the transcript (if any)  \n  • Recommended readings: academic articles, videos, or educational web resources  \n\n🎯 Reference Guidelines:\n- Return up to **10 references** as a **JSON array of objects**\n- Each object must contain:  \n  • \"title\" – a short, clear name of the resource (string)  \n  • \"url\" - a real, working URL (string)\n- Example format:\n[\n  { \"title\": \"Modern Portfolio Theory (MPT)\", \"url\": \"https://www.investopedia.com/terms/m/modernportfoliotheory.asp\" },\n  { \"title\": \"Efficient Frontier Explained\", \"url\": \"https://www.khanacademy.org/economics-finance-domain/core-finance/investment-vehicles-tutorial/modern-portfolio-theory/v/efficient-frontier\" }\n]\n- DO NOT use markdown link syntax (e.g., `[title](url)`)\n- DO NOT include any commentary or formatting outside the JSON array\n- If no references are found, return an empty array: `[]`\n\n🎓 Preferred Sources (if applicable):\n- Academic domains like `.edu`, `.org`, `https://doi.org/`, or trusted sources like:  \n  Google Scholar, PubMed, Khan Academy, MIT OpenCourseWare, Stanford Encyclopedia of Philosophy, etc.\n\n📌 If no sources were mentioned in the transcript:\n- Still provide 5 highly relevant resources  \n- At least 2-3 should be high-quality academic or educational URLs based on the topic\n]\n"
            "@@OPTIONAL_REFERENCES_END@@\n\n"
            "Here is the lecture transcript:\n\n"
            f"{transcript}"
        )

        try:
            response = await self.client.chat.completions.create(
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
            "study_questions"
        ]

        sections = {
            "lecture_title": "LECTURE_TITLE",
            "topic_summary_sentence": "TOPIC_SUMMARY",
            "key_concepts": "KEY_CONCEPTS",
            "main_points_covered": "MAIN_POINTS",
            "conclusion_takeaways": "CONCLUSION_TAKEAWAYS",
            "study_questions": "STUDY_QUESTIONS",
        }
        
        json_sections = {
            "references": "OPTIONAL_REFERENCES",
            "section_summaries": "SECTION_SUMMARIES",
            "flashcards": "FLASHCARDS"
        }

        for key, section_name in json_sections.items():
            start_marker = f"@@{section_name}_START@@"
            end_marker = f"@@{section_name}_END@@"
            match = re.search(f"{re.escape(start_marker)}(.*?){re.escape(end_marker)}", summary_text, re.DOTALL)
            if match:
                try:
                    content = match.group(1).strip()
                    if content and content.lower() not in ["none", "not available", "[]"]:
                        parsed_data[key] = json.loads(content)
                        print(f"Successfully parsed JSON for {key}")
                    else:
                        parsed_data[key] = []
                except json.JSONDecodeError as e:
                    print(f"Error parsing JSON for section {key}: {e}")
                    parsed_data[key] = []
            else:
                print(f"Markers for JSON section '{section_name}' not found.")
                parsed_data[key] = []

        for key, section_name in sections.items():
            start_marker = f"@@{section_name}_START@@"
            end_marker = f"@@{section_name}_END@@"
            
            match = re.search(f"{re.escape(start_marker)}(.*?){re.escape(end_marker)}", summary_text, re.DOTALL)
            if match:
                content = match.group(1).strip()
                if content.lower() in ["none", "not available", ""]:
                    parsed_data[key] = [] if key in array_sections_keys else ""
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
                parsed_data[key] = [] if key in array_sections_keys else ""
                print(f"Warning: Markers for section '{section_name}' not found in summary.")

        return parsed_data
