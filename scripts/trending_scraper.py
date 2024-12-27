import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os
from os import path

# Headers to mimic a browser
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
        " Chrome/91.0.4472.124 Safari/537.36"
    )
}

# URLs for different endpoints
TOPICS_URL = "https://countik.com/popular/topics"
CREATORS_URL = "https://countik.com/popular/creators"
HASHTAGS_URL = "https://countik.com/popular/hashtags"
SONGS_URL = "https://countik.com/popular/songs"


def fetch_page_content(url, headers):
    """
    Fetch the content of the web page with headers.
    """
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        return f"Error fetching the page: {e}"

# Topics functions
def parse_keyword_trending(html_content):
    """
    Parse the HTML content to extract 'keyword-trending' values and corresponding scores.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        trending_keywords = []
        rows = soup.find_all('tr')
        for row in rows:
            keyword_tag = row.find('p', class_='keyword')
            score_tag = row.find('p', class_='score')
            if keyword_tag and score_tag:
                keyword = keyword_tag.text.strip()
                score = score_tag.text.strip()
                trending_keywords.append({'keyword': keyword, 'score': score})
        return trending_keywords
    except Exception as e:
        return f"Error parsing the content: {e}"

def get_trending_keywords():
    html_content = fetch_page_content(TOPICS_URL, HEADERS)
    if "Error" in html_content:
        return html_content
    
    trending_keywords = parse_keyword_trending(html_content)
    if isinstance(trending_keywords, str):
        return trending_keywords
    
    if trending_keywords:
        result = "Trending Keywords and Scores:\n"
        for idx, item in enumerate(trending_keywords, start=1):
            result += f"{idx}. {item['keyword']} - Score: {item['score']}\n"
        return result
    else:
        return "No trending keywords found."

# Creators functions
def parse_creators(html_content):
    """
    Parse the HTML content to extract usernames and nicknames.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        creators = []
        rows = soup.select("div.list-creators table tr")
        for row in rows:
            username_tag = row.find('p', class_='username')
            nickname_tag = row.find('p', class_='nickname')
            if username_tag and nickname_tag:
                username = username_tag.text.strip()
                nickname = nickname_tag.text.strip()
                creators.append({'username': username, 'nickname': nickname})
        return creators
    except Exception as e:
        return f"Error parsing the content: {e}"

def get_creators():
    html_content = fetch_page_content(CREATORS_URL, HEADERS)
    if "Error" in html_content:
        return html_content
    
    creators = parse_creators(html_content)
    if isinstance(creators, str):
        return creators
    
    if creators:
        result = "Trending Creators in the US on " + datetime.now().strftime("%m/%d/%Y") + ":\n"
        for index, creator in enumerate(creators, start=1):
            result += f"{index}. Username: {creator['username']}, Nickname: {creator['nickname']}\n"
        return result
    else:
        return "No creators found."

# Hashtags functions
def parse_trending_hashtags(html_content):
    """
    Parse the HTML content to extract trending hashtags.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        trending_hashtags = []
        rows = soup.find_all('tr')
        for row in rows:
            hashtag_tag = row.find('a', href=True)
            if hashtag_tag:
                hashtag = hashtag_tag.text.strip()
                trending_hashtags.append(hashtag)
        return trending_hashtags
    except Exception as e:
        return f"Error parsing the content: {e}"

def get_trending_hashtags():
    html_content = fetch_page_content(HASHTAGS_URL, HEADERS)
    if "Error" in html_content:
        return html_content
    
    trending_hashtags = parse_trending_hashtags(html_content)
    if isinstance(trending_hashtags, str):
        return trending_hashtags
    
    if trending_hashtags:
        result = "\n\nTrending Hashtags\n"
        for idx, hashtag in enumerate(trending_hashtags, start=1):
            result += f"{idx}. {hashtag}\n"
        return result
    else:
        return "No trending hashtags found."

# Songs functions
def parse_top_songs(html_content):
    """
    Parse the HTML content to extract top songs with their respective artist names.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        top_songs = []
        rows = soup.find_all('tr')
        for row in rows:
            rank_tag = row.find('td', class_='rank')
            title_tag = row.find('p', class_='title')
            artist_tag = row.find('p', class_='artist')
            if rank_tag and title_tag and artist_tag:
                rank = rank_tag.text.strip()
                title = title_tag.text.strip()
                artist = artist_tag.text.strip()
                top_songs.append({'rank': rank, 'title': title, 'artist': artist})
        return top_songs
    except Exception as e:
        return f"Error parsing the content: {e}"

def get_top_songs():
    html_content = fetch_page_content(SONGS_URL, HEADERS)
    if "Error" in html_content:
        return html_content
    
    top_songs = parse_top_songs(html_content)
    if isinstance(top_songs, str):
        return top_songs
    
    if top_songs:
        result = "\n\nTop Songs and Artists:\n"
        for song in top_songs:
            result += f"Rank {song['rank']}: {song['title']} by {song['artist']}\n"
        return result
    else:
        return "No top songs found."

def write_to_file():
    """
    Write all scraped data to a file named with today's date
    """
    date_str = datetime.now().strftime("%m-%d-%Y")
    filename = path.join(os.path.dirname(__file__), f"{date_str}.txt")
    
    # Collect all data
    creators_data = get_creators()
    keywords_data = get_trending_keywords()
    hashtags_data = get_trending_hashtags()
    songs_data = get_top_songs()
    
    # Write to file
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(creators_data + "\n\n")
        f.write(keywords_data + "\n")
        f.write(hashtags_data + "\n")
        f.write(songs_data)
    
    print(f"File created: {filename}")  # Add logging

if __name__ == "__main__":
    write_to_file() 