
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

def fetch_transcript(video_id):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        formatter = TextFormatter()
        return formatter.format_transcript(transcript)
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

video_id = "loXc0Tyi4R4"
transcript = fetch_transcript(video_id)
if transcript:
    print(transcript)
