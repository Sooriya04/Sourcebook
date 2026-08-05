from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
import yt_dlp

app = FastAPI(
    title="YouTube Search & Transcript API",
    description="API to search YouTube videos and fetch transcripts",
    version="1.0.0"
)

# Request schema
class SearchRequest(BaseModel):
    query: str
    max_video: int = 5

def search_youtube_videos(query: str, max_results: int):
    """Uses yt-dlp to search YouTube and get video metadata without downloading video files."""
    ydl_opts = {
        'extract_flat': True,       # Fast search without downloading video details
        'skip_download': True,      # Metadata only
        'quiet': True,
        'no_warnings': True,
    }
    search_url = f"ytsearch{max_results}:{query}"
    
    videos = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(search_url, download=False)
        if result and 'entries' in result:
            for entry in result['entries']:
                if entry:
                    video_id = entry.get("id")
                    videos.append({
                        "video_id": video_id,
                        "title": entry.get("title", "Unknown Title"),
                        "url": entry.get("url") or f"https://www.youtube.com/watch?v={video_id}",
                    })
    return videos

@app.post("/search/youtube")
def search_youtube(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
        
    # 1. Search YouTube for videos matching the query
    videos = search_youtube_videos(request.query, request.max_video)
    
    if not videos:
        raise HTTPException(status_code=404, detail="No videos found matching the query.")

    results = []
    # 2. Extract transcript for each found video
    for video in videos:
        video_id = video["video_id"]
        full_text = None
        status = "success"

        try:
            # Fetch transcript (defaults to English 'en', handles auto-generated captions too)
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
            
            # Extract text elements (handles both dict and object formats)
            full_text = " ".join([
                item['text'] if isinstance(item, dict) else item.text 
                for item in transcript_data
            ])
        except Exception as e:
            status = f"Transcript unavailable: {type(e).__name__}"

        results.append({
            "video_id": video_id,
            "title": video["title"],
            "url": video["url"],
            "status": status,
            "transcript": full_text
        })

    return {
        "query": request.query,
        "count": len(results),
        "results": results
    }