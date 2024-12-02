import requests
from bs4 import BeautifulSoup

# URL of the website to scrape
URL = "https://countik.com/popular/topics"

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

def parse_keyword_trending(html_content):
    """
    Parse the HTML content to extract 'keyword-trending' values and corresponding scores.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        trending_keywords = []

        # Find all table rows (or adjust if the structure differs)
        rows = soup.find_all('tr')
        for row in rows:
            # Extract the keyword and score from each row
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
    """
    Main function to fetch, parse, and return trending keywords and scores as a string.
    """
    html_content = fetch_page_content(URL, HEADERS)
    if "Error" in html_content:
        return html_content
    
    trending_keywords = parse_keyword_trending(html_content)
    if isinstance(trending_keywords, str):  # Check if there was an error in parsing
        return trending_keywords
    
    if trending_keywords:
        result = "Trending Keywords and Scores:\n"
        for idx, item in enumerate(trending_keywords, start=1):
            result += f"{idx}. {item['keyword']} - Score: {item['score']}\n"
        return result
    else:
        return "No trending keywords found."

# Example of calling the function
if __name__ == "__main__":
    print(get_trending_keywords())
