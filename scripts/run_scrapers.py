import sys
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import DictCursor
from topics import get_trending_keywords
from hashtags import get_trending_hashtags
from songs import get_top_songs
from creators import get_creators
from dotenv import load_dotenv
import json

def store_daily_trends():
    # Load environment variables from .env file
    load_dotenv()
    
    # Get all trend data and check for errors
    topics_data = get_trending_keywords()
    hashtags_data = get_trending_hashtags()
    songs_data = get_top_songs()
    creators_data = get_creators()

    # Check if any of the responses contain error messages
    if any(isinstance(data, str) and data.startswith("Error") for data in [topics_data, hashtags_data, songs_data, creators_data]):
        print("Error in scraping data:")
        print(f"Topics: {topics_data}")
        print(f"Hashtags: {hashtags_data}")
        print(f"Songs: {songs_data}")
        print(f"Creators: {creators_data}")
        return

    # Convert data to JSON strings
    try:
        topics_json = json.dumps({"data": topics_data})
        hashtags_json = json.dumps({"data": hashtags_data})
        songs_json = json.dumps({"data": songs_data})
        creators_json = json.dumps({"data": creators_data})
    except Exception as e:
        print(f"Error converting data to JSON: {e}")
        return

    # Connect to database using environment variables
    database_url = os.environ.get('POSTGRES_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=DictCursor)

        # Insert new trends
        cur.execute("""
            INSERT INTO daily_trends (topics, hashtags, songs, creators)
            VALUES (%s, %s, %s, %s)
        """, (topics_json, hashtags_json, songs_json, creators_json))
        
        conn.commit()
        print("Successfully stored trends in database")
    except Exception as e:
        print(f"Error storing trends: {e}")
        conn.rollback()
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    store_daily_trends() 