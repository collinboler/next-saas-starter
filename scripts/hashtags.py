import requests
from bs4 import BeautifulSoup

# URL of the website to scrape
URL = "https://countik.com/popular/hashtags"

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

def parse_trending_hashtags(html_content):
    """
    Parse the HTML content to extract trending hashtags.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        trending_hashtags = []

        # Find the table containing hashtags
        rows = soup.find_all('tr')
        for row in rows:
            # Extract hashtag link text
            hashtag_tag = row.find('a', href=True)
            if hashtag_tag:
                hashtag = hashtag_tag.text.strip()
                trending_hashtags.append(hashtag)

        return trending_hashtags
    except Exception as e:
        return f"Error parsing the content: {e}"

def get_trending_hashtags():
    """
    Main function to fetch, parse, and return trending hashtags as a string.
    """
    html_content = fetch_page_content(URL, HEADERS)
    if "Error" in html_content:
        return html_content
    
    trending_hashtags = parse_trending_hashtags(html_content)
    if isinstance(trending_hashtags, str):  # Check if there was an error in parsing
        return trending_hashtags
    
    if trending_hashtags:
        result = "Trending Hashtags:\n"
        for idx, hashtag in enumerate(trending_hashtags, start=1):
            result += f"{idx}. {hashtag}\n"
        return result
    else:
        return "No trending hashtags found."

# Example of calling the function
if __name__ == "__main__":
    print(get_trending_hashtags())
