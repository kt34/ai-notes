# backend/app/seed_lecture.py
import os
import sys
from uuid import uuid4 # To generate a new UUID for the lecture if needed by your schema
import asyncio
import json
import websockets
from pathlib import Path
import wave
import time

# Add the parent directory to Python path to allow imports
sys.path.append(str(Path(__file__).parent.parent))

from app.config import settings
from app.summarizer import Summarizer as SummarizerService # Use the actual class name
from app.db import supabase # Your initialized Supabase client

# --- Configuration ---
# !!! REPLACE WITH YOUR ACTUAL TEST USER ID FROM SUPABASE AUTH !!!
TEST_USER_ID = "66f5879e-5832-42d5-93d1-a5fa30b5984c" 
TRANSCRIPT_FILE_PATH = "/Users/kevinton/Desktop/Projects/ai-notes/backend/app/transcript.txt" # In the same backend/app/ directory

async def create_mock_lecture(user_id: str, transcript_content: str):
    if user_id == "YOUR_SUPABASE_USER_ID_HERE":
        print("ERROR: Please update TEST_USER_ID in the script with a valid Supabase User ID.")
        return

    print(f"Processing transcript for user: {user_id}")

    summarizer = SummarizerService(api_key=settings.OPENAI_API_KEY)

    # Debug: Print transcript length
    print(f"\nTranscript length: {len(transcript_content)} characters")

    # 1. Summarize the transcript
    print("\nSummarizing transcript with OpenAI...")
    full_summary_text = await summarizer.summarize(transcript_content)
    if "Error generating summary" in full_summary_text or \
       "No transcript provided to summarize" in full_summary_text:
        print(f"Failed to generate summary: {full_summary_text}")
        return
    print("Summary generated.")
    
    # Debug: Print the raw summary text
    print("\n--- Raw Summary Text ---")
    print(full_summary_text[:500] + "..." if len(full_summary_text) > 500 else full_summary_text)

    # 2. Parse the summary into structured data
    print("\nParsing structured summary...")
    structured_summary_data = summarizer.parse_structured_summary(full_summary_text)
    print("Summary parsed.")
    
    # Debug: Print the section summaries specifically
    print("\n--- Section Summaries Debug ---")
    section_summaries = structured_summary_data.get("section_summaries")
    if section_summaries:
        print(f"Found {len(section_summaries)} section summaries in parsed data")
        print("First section summary sample:", json.dumps(section_summaries[0], indent=2) if section_summaries else "None")
        print("\nSection Summaries Structure:")
        for i, section in enumerate(section_summaries):
            print(f"\nSection {i + 1}:")
            print(f"- timestamp_marker: {section.get('timestamp_marker', 'MISSING')}")
            print(f"- main_topics count: {len(section.get('main_topics', []))}")
            print(f"- key_points count: {len(section.get('key_points', []))}")
            print(f"- examples count: {len(section.get('examples', [])) if section.get('examples') else 0}")
            print(f"- summary length: {len(section.get('summary', ''))}")
    else:
        print("No section summaries found in parsed data")
        print("Available keys in structured_summary_data:", list(structured_summary_data.keys()))
        # Debug: Look for section summaries in the raw text
        if "@@SECTION_SUMMARIES_START@@" in full_summary_text:
            start_idx = full_summary_text.find("@@SECTION_SUMMARIES_START@@")
            end_idx = full_summary_text.find("@@SECTION_SUMMARIES_END@@")
            if start_idx != -1 and end_idx != -1:
                raw_section = full_summary_text[start_idx:end_idx+24]
                print("\nRaw section summaries content found:")
                print(raw_section)
                print("\nTrying to parse raw section summaries...")
                try:
                    raw_json_str = raw_section.replace("@@SECTION_SUMMARIES_START@@", "").replace("@@SECTION_SUMMARIES_END@@", "").strip()
                    parsed_sections = json.loads(raw_json_str)
                    print("Successfully parsed raw sections:", len(parsed_sections))
                    section_summaries = parsed_sections
                except json.JSONDecodeError as e:
                    print("Failed to parse raw sections:", str(e))

    # 3. Prepare data for insertion
    # Use lecture_title from AI if available, otherwise generate a fallback
    lecture_title_from_ai = structured_summary_data.get("lecture_title")
    final_title = "Seeded Lecture" # Default fallback
    if lecture_title_from_ai and lecture_title_from_ai.lower() not in ["none", "not available", ""]:
        final_title = lecture_title_from_ai
    elif transcript_content: # Fallback to transcript start if AI title is bad
        final_title = transcript_content.split('.')[0].strip()
        if len(final_title) > 150:
            final_title = ' '.join(final_title.split()[:15]) + '...'
        if not final_title: # If transcript is very short or starts weirdly
             final_title = f"Lecture seeded on {datetime.now().strftime('%Y-%m-%d')}"

    lecture_data_to_insert = {
        "user_id": user_id,
        "transcript": transcript_content,
        "summary": full_summary_text, 
        "lecture_title": final_title,
        "topic_summary_sentence": structured_summary_data.get("topic_summary_sentence"),
        "key_concepts": structured_summary_data.get("key_concepts"),
        "main_points_covered": structured_summary_data.get("main_points_covered"),
        "examples_mentioned": structured_summary_data.get("examples_mentioned"),
        "important_quotes": structured_summary_data.get("important_quotes"),
        "conclusion_takeaways": structured_summary_data.get("conclusion_takeaways"),
        "references": structured_summary_data.get("references"),
        "section_summaries": section_summaries or []  # Explicitly use the variable we checked
    }

    # Debug: Print the section summaries being inserted
    print("\n--- Data Being Inserted ---")
    print("Section Summaries Count:", len(lecture_data_to_insert["section_summaries"]))
    print("Section Summaries Type:", type(lecture_data_to_insert["section_summaries"]))
    if lecture_data_to_insert["section_summaries"]:
        print("First Section Summary:", json.dumps(lecture_data_to_insert["section_summaries"][0], indent=2))
        print("\nFull section_summaries JSON:")
        print(json.dumps(lecture_data_to_insert["section_summaries"], indent=2))

    # 4. Insert into Supabase
    print(f"\nInserting lecture titled '{final_title}' into Supabase...")
    try:
        response = supabase.table("lectures").insert(lecture_data_to_insert).execute()
        if response.data and len(response.data) > 0:
            inserted_lecture_id = response.data[0].get('id')
            print(f"Successfully inserted lecture! ID: {inserted_lecture_id}")
            print(f"You should now be able to see this lecture in the frontend for user {user_id}.")
            
            # Verify the inserted data
            print("\nVerifying inserted data...")
            verification = supabase.table("lectures").select("section_summaries").eq("id", inserted_lecture_id).execute()
            if verification.data:
                inserted_summaries = verification.data[0].get("section_summaries", [])
                print(f"Verified section summaries count in DB: {len(inserted_summaries)}")
                if inserted_summaries:
                    print("First section summary in DB:", json.dumps(inserted_summaries[0], indent=2))
                else:
                    print("No section summaries found in DB after insertion")
                    print("Full verification response:", json.dumps(verification.data[0], indent=2))
            else:
                print("No data returned from verification query")
                print("Full verification response:", verification)
        else:
            print("Failed to insert lecture. No data returned from Supabase.")
            if hasattr(response, 'error') and response.error:
                print(f"Supabase error: {response.error}")
                print("Full response:", response)

    except Exception as e:
        print(f"Error inserting lecture into Supabase: {e}")
        import traceback
        traceback.print_exc()

async def main():
    if not settings.OPENAI_API_KEY or not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        print("Error: Missing one or more required environment variables (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY).")
        return

    try:
        with open(TRANSCRIPT_FILE_PATH, 'r', encoding='utf-8') as f:
            sample_transcript = f.read()
    except FileNotFoundError:
        print(f"Error: Transcript file not found at '{TRANSCRIPT_FILE_PATH}'.")
        print("Place your sample_lecture_transcript.txt in the backend/app/ directory.")
        return
    
    if not sample_transcript.strip():
        print(f"Error: The transcript file '{TRANSCRIPT_FILE_PATH}' is empty.")
        return

    await create_mock_lecture(TEST_USER_ID, sample_transcript)

if __name__ == "__main__":
    from datetime import datetime # For fallback title
    asyncio.run(main())