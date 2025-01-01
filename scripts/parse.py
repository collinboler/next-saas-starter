#!/usr/bin/env python3

import re
import sys
from datetime import datetime

def parse_int(value):
    """Attempt to convert a string to int safely."""
    try:
        return int(value.replace(',', ''))
    except:
        return 0

def parse_float(value):
    """Attempt to convert a string to float safely."""
    try:
        return float(value.replace('%', '').replace(',', ''))
    except:
        return 0.0

def extract_field(pattern, text, default=""):
    """
    Utility to extract a single match from the text using
    a provided regex pattern. Returns the first match or a default.
    """
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else default

def extract_music_info(block_text):
    """
    Look for a line matching a Markdown link for music, e.g.:
    [Khabane lame - original sound - khaby.lame](https://www.tiktok.com/music/...)

    Return (music_title, music_link). If not found, return empty placeholders.
    """
    # Updated pattern: captures everything inside [ ... ] as the music title,
    # and everything inside ( ... ) as the music link — but only if it starts
    # with "https://www.tiktok.com/music/"
    pattern = re.compile(
        r'\[([^\]]+)\]\((https://www\.tiktok\.com/music[^\)]+)\)',
        re.IGNORECASE
    )
    match = pattern.search(block_text)
    if match:
        music_title = match.group(1).strip()
        music_link = match.group(2).strip()
        return music_title, music_link
    return "", ""

def extract_gif_link(block_text):
    """
    Look for a line with a GIF or image in markdown format, e.g.:
    ![Some caption](https://p16-...)
    
    Return (gif_caption, gif_url). If not found, return empty placeholders.
    """
    pattern = re.compile(
        r'!\[([^\]]*)\]\((https?://[^\)]+)\)',
        re.IGNORECASE
    )
    match = pattern.search(block_text)
    if match:
        gif_caption = match.group(1).strip()
        gif_url = match.group(2).strip()
        return gif_caption, gif_url
    return "", ""

def extract_all_videos(raw_text):
    """
    Extract video-level data from the raw text by capturing blocks that
    start with ![ ... ](...) and continue until the next image or heading.
    """
    # We'll capture each 'block' up to the next ![ or heading
    pattern = re.compile(
        r'(!\[.*?\]\(.*?\)\s*Views\s*[\s\S]*?(?=(?:\n!\[|## |### |$)))',
        re.IGNORECASE
    )
    blocks = pattern.findall(raw_text)

    videos = []
    for block in blocks:
        # Extract the GIF info (title/alt text is used as "gif_caption")
        gif_caption, gif_link = extract_gif_link(block)

        # Stats
        views_str = extract_field(r"Views\s+(\d[\d,]*)", block, "0")
        likes_str = extract_field(r"Likes\s+(\d[\d,]*)", block, "0")
        comments_str = extract_field(r"Comments\s+(\d[\d,]*)", block, "0")
        shares_str = extract_field(r"Shares\s+(\d[\d,]*)", block, "0")
        hashtags_str = extract_field(r"Hashtags\s+(\d+)", block, "0")
        mentions_str = extract_field(r"Mentions\s+(\d+)", block, "0")
        saves_str = extract_field(r"Saves\s+(\d+)", block, "0")

        engagement_str = extract_field(r"Engagement Rate\s*([\d\.]+%)", block, "0%")

        # Date posted line if present, e.g. "12/21/2024, 02:58 PM"
        date_posted = extract_field(
            r'(\d{1,2}/\d{1,2}/\d{4}, \d{1,2}:\d{2} (?:AM|PM))',
            block,
            ""
        )

        # The "video title" might be the first line of the GIF caption,
        # or you can parse a separate line. For simplicity, let's assume
        # the entire alt text is also the "title."
        video_title = gif_caption

        # If you want them separate, define your own approach. For now, 
        # we'll store them the same for "title" and "caption."
        video_caption = gif_caption

        # Extract music info
        music_title, music_link = extract_music_info(block)

        videos.append({
            "views": parse_int(views_str),
            "likes": parse_int(likes_str),
            "comments": parse_int(comments_str),
            "shares": parse_int(shares_str),
            "hashtags": hashtags_str,
            "mentions": mentions_str,
            "saves": parse_int(saves_str),
            "engagement_rate": parse_float(engagement_str),
            "date_posted": date_posted,
            "title": video_title.strip(),
            "caption": video_caption.strip(),
            "gif_link": gif_link,
            "music_title": music_title.strip(),
            "music_link": music_link.strip()
        })

    return videos

def main(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    # --- Extract top-level fields ---
    total_followers = extract_field(r"Total Followers\s+(\d[\d,]*)", raw_text, "0")
    total_likes = extract_field(r"Total Likes\s+(\d[\d,]*)", raw_text, "0")
    total_videos = extract_field(r"Total Videos\s+(\d[\d,]*)", raw_text, "0")

    total_engagement_rate = extract_field(r"Total Engagement Rates\s*([\d\.]+%)", raw_text, "0%")
    likes_rate = extract_field(r"[Ll]ikes\s*[Rr]ate\s*([\d\.]+%)", raw_text, "0%")
    comments_rate = extract_field(r"[Cc]omments\s*[Rr]ate\s*([\d\.]+%)", raw_text, "0%")
    shares_rate = extract_field(r"[Ss]hares\s*[Rr]ate\s*([\d\.]+%)", raw_text, "0%")

    avg_views = extract_field(r"Avg\. Views\s+(\d[\d,]*)", raw_text, "0")
    avg_likes = extract_field(r"Avg\. Likes\s+(\d[\d,]*)", raw_text, "0")
    avg_comments = extract_field(r"Avg\. Comments\s+(\d[\d,]*)", raw_text, "0")
    avg_shares = extract_field(r"Avg\. Shares\s+(\d[\d,]*)", raw_text, "0")

    # Parse a few top hashtags if available (#example(15))
    top_hashtags_pattern = re.compile(r"(#[A-Za-z0-9_]+)\((\d+)\)", re.IGNORECASE)
    top_hashtags = top_hashtags_pattern.findall(raw_text)

    # --- Extract all videos from the raw data ---
    videos = extract_all_videos(raw_text)

    # Sort them by view count descending
    videos.sort(key=lambda v: v['views'], reverse=True)

    # --- Build the output lines ---
    output_lines = []
    # 1) Account Overview
    output_lines.append("### **Account Overview:**\n")
    output_lines.append("Brief summary of the account, its themes, etc.\n")

    output_lines.append("**Key Statistics:**")
    output_lines.append(f"- **Total Followers**: {total_followers}")
    output_lines.append(f"- **Total Likes**: {total_likes}")
    output_lines.append(f"- **Total Videos**: {total_videos}")
    output_lines.append("- **Average Video Performance:**")
    output_lines.append(f"  - **Views**: {avg_views}")
    output_lines.append(f"  - **Likes**: {avg_likes}")
    output_lines.append(f"  - **Comments**: {avg_comments}")
    output_lines.append(f"  - **Shares**: {avg_shares}")
    output_lines.append(f"- **Total Engagement Rate**: {total_engagement_rate}")
    output_lines.append(f"  - **Likes Rate**: {likes_rate}")
    output_lines.append(f"  - **Comments Rate**: {comments_rate}")
    output_lines.append(f"  - **Shares Rate**: {shares_rate}\n")

    if top_hashtags:
        output_lines.append("**Most Used Hashtags:**")
        for i, (htag, count) in enumerate(top_hashtags[:3], start=1):
            output_lines.append(f"{i}. {htag} ({count})")
    output_lines.append("---\n")

    # 2) Videos Ranked by Popularity
    output_lines.append("### **Videos Ranked by Popularity:**\n")

    for idx, vid in enumerate(videos, start=1):
        heading_title = vid['title'] if vid['title'] else f"Video #{idx}"

        output_lines.append(f"#### {idx}. **{heading_title}**")

        # If "title" == "caption" in your data, you can skip.
        # Otherwise, show them separately:
        if vid["caption"]:
            output_lines.append(f"- **Caption**: {vid['caption']}")
        else:
            output_lines.append("- **Caption**: (No caption)")

        output_lines.append(f"- **Date posted**: {vid['date_posted']}")
        output_lines.append(f"- **Views**: {vid['views']}")
        output_lines.append(f"- **Likes**: {vid['likes']}")
        output_lines.append(f"- **Comments**: {vid['comments']}")
        output_lines.append(f"- **Shares**: {vid['shares']}")
        output_lines.append(f"- **Engagement Rate**: {vid['engagement_rate']}%")
        output_lines.append(f"- **Hashtags**: {vid['hashtags']}")

        # Music
        if vid['music_title'] and vid['music_link']:
            output_lines.append(f"- **Music**: [{vid['music_title']}]({vid['music_link']})")
        else:
            output_lines.append("- **Music**: [Music Title and Link]")

        # GIF
        if vid['gif_link']:
            output_lines.append(f"- **GIF Preview**: [{vid['title']}]({vid['gif_link']})\n")
        else:
            output_lines.append("- **GIF Preview**: [No GIF link available]\n")

    output_lines.append("---\n")

    # 3) Observations
    output_lines.append("### **Observations:**\n")
    output_lines.append("- Most popular content, hashtag usage, etc.")
    output_lines.append("- Observations about audience engagement trends.")
    output_lines.append("- (If a specific music track is consistently popular, mention it here.)\n")

    # 4) Instructions for Use
    output_lines.append("### **Instructions for Use:**")
    output_lines.append("1. Input the webscraped data as structured info ... etc.")
    output_lines.append("2. Replace placeholders like [Total Followers], etc.")
    output_lines.append("3. Ensure videos are ranked by views, include all metadata, etc.")
    output_lines.append("4. Include ALL videos in the webscraped content.")
    output_lines.append("5. Write concise but informative observations.")
    output_lines.append("6. If a specific music track shows high average performance, highlight it.")
    output_lines.append("7. Ensure GIF previews are properly formatted as hyperlinks.\n")

    # Print final output
    print("\n".join(output_lines))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tiktok_parser.py rawdata.txt")
        sys.exit(1)
    main(sys.argv[1]) 