import sys
import os
from datetime import datetime

# Add the parent directory to Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import get_user_lectures
from app.config import settings

def test_fetch_lectures():
    # Use a test user ID - replace with an actual user ID from your database
    test_user_id = "test_user"
    
    try:
        # Fetch lectures for the test user
        lectures = get_user_lectures(test_user_id)
        
        # Print the results
        print(f"\nFetched {len(lectures)} lectures for user {test_user_id}")
        print("-" * 50)
        
        for idx, lecture in enumerate(lectures, 1):
            print(f"\nLecture {idx}:")
            print(f"Created at: {lecture.get('created_at', 'N/A')}")
            print(f"Summary: {lecture.get('summary', 'N/A')[:100]}...")  # Print first 100 chars of summary
            print("-" * 50)
            
    except Exception as e:
        print(f"Error fetching lectures: {str(e)}")

if __name__ == "__main__":
    test_fetch_lectures() 