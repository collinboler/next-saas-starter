import requests
from bs4 import BeautifulSoup

# URL of the website to scrape
URL = "https://countik.com/popular/songs"  # Replace with the actual endpoint

# Headers to mimic a browser
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
        " Chrome/91.0.4472.124 Safari/537.36"
    )
}

def fetch_page_content(url, headers):
    """
    Fetch the content of the web page with headers.
    """
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an error for bad status codes
        return response.text
    except requests.RequestException as e:
        return f"Error fetching the page: {e}"

def parse_top_songs(html_content):
    """
    Parse the HTML content to extract top songs with their respective artist names.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        top_songs = []

        # Find all table rows
        rows = soup.find_all('tr')
        for row in rows:
            rank_tag = row.find('td', class_='rank')  # Extract rank
            title_tag = row.find('p', class_='title')  # Extract title
            artist_tag = row.find('p', class_='artist')  # Extract artist name

            if rank_tag and title_tag and artist_tag:
                rank = rank_tag.text.strip()
                title = title_tag.text.strip()
                artist = artist_tag.text.strip()
                top_songs.append({'rank': rank, 'title': title, 'artist': artist})

        return top_songs
    except Exception as e:
        return f"Error parsing the content: {e}"

def get_top_songs():
    """
    Main function to fetch, parse, and return top songs and artists.
    """
    html_content = fetch_page_content(URL, HEADERS)
    if "Error" in html_content:
        return html_content
    
    top_songs = parse_top_songs(html_content)
    if isinstance(top_songs, str):  # Check if there was an error in parsing
        return top_songs
    
    if top_songs:
        result = "Top Songs and Artists:\n"
        for song in top_songs:
            result += f"Rank {song['rank']}: {song['title']} by {song['artist']}\n"
        return result
    else:
        return "No top songs found."

# Example of calling the function
if __name__ == "__main__":
    print(get_top_songs())
