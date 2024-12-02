import requests
from bs4 import BeautifulSoup

# URL of the website to scrape
URL = "https://countik.com/popular/creators"

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

def parse_creators(html_content):
    """
    Parse the HTML content to extract usernames and nicknames.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        creators = []

        # Navigate to the table containing the list of creators
        rows = soup.select("div.list-creators table tr")  # Use CSS selectors to find rows

        for row in rows:
            username_tag = row.find('p', class_='username')  # Extract username
            nickname_tag = row.find('p', class_='nickname')  # Extract nickname

            if username_tag and nickname_tag:
                username = username_tag.text.strip()
                nickname = nickname_tag.text.strip()
                creators.append({'username': username, 'nickname': nickname})

        return creators
    except Exception as e:
        return f"Error parsing the content: {e}"

def get_creators():
    """
    Main function to fetch, parse, and return creators' usernames and nicknames.
    """
    html_content = fetch_page_content(URL, HEADERS)
    if "Error" in html_content:
        return html_content
    
    creators = parse_creators(html_content)
    if isinstance(creators, str):  # Check if there was an error in parsing
        return creators
    


    if creators:
        result = "Enumerated Creators' Usernames and Nicknames:\n"
        for index, creator in enumerate(creators, start=1):
            result += f"{index}. Username: {creator['username']}, Nickname: {creator['nickname']}\n"
        return result
    else:
        return "No creators found."

# Example of calling the function
if __name__ == "__main__":
    print(get_creators())
