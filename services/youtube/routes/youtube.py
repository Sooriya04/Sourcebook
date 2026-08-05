import time

from fastapi import APIRouter, HTTPException

from logger import logger
from models import VideoRequest
from services.transcript import TranscriptService

from youtube_transcript_api import (
    NoTranscriptFound,
    TranscriptsDisabled,
)
from youtube_transcript_api._errors import RequestBlocked

router = APIRouter()


@router.post("/transcript")
def transcript(req: VideoRequest):

    started = time.perf_counter()

    logger.info("Incoming request: %s", req.url)

    try:

        result = TranscriptService.fetch(str(req.url))

        logger.info(
            "Fetched transcript %s (%d segments)",
            result["video_id"],
            result["segments"],
        )

        return {
            "text": result["text"]
        }

    except NoTranscriptFound:

        logger.warning("Transcript not found")

        raise HTTPException(
            status_code=404,
            detail="Transcript not found",
        )

    except TranscriptsDisabled:

        logger.warning("Transcript disabled")

        raise HTTPException(
            status_code=403,
            detail="Transcript disabled",
        )

    except RequestBlocked:

        logger.warning("YouTube blocked the request (Rate Limit / IP Block)")

        raise HTTPException(
            status_code=429,
            detail="YouTube rate-limit or IP block",
        )

    except Exception as e:

        logger.warning(f"Unexpected error: {type(e).__name__} - {str(e)}")

        raise HTTPException(
            status_code=500,
            detail="Internal Server Error",
        )

from concurrent.futures import ThreadPoolExecutor, as_completed
from models import SearchRequest
from services.search import YouTubeSearchService
from youtube_transcript_api import YouTubeTranscriptApi

@router.post("/search")
def search_youtube(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
        
    logger.info("Incoming search request: %s (max_video=%d)", request.query, request.max_video)
    
    videos = YouTubeSearchService.search(request.query, request.max_video)
    
    if not videos:
        logger.warning("No videos found matching the query")
        raise HTTPException(status_code=404, detail="No videos found matching the query.")

    results = []
    
    def fetch_video_transcript(video):
        video_id = video["video_id"]
        full_text = None
        status = "success"
        try:
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
            full_text = " ".join([
                item['text'] if isinstance(item, dict) else getattr(item, 'text', '')
                for item in transcript_data
            ])
        except Exception as e:
            status = f"Transcript unavailable: {type(e).__name__}"

        return {
            "video_id": video_id,
            "title": video["title"],
            "url": video["url"],
            "status": status,
            "transcript": full_text
        }

    with ThreadPoolExecutor(max_workers=request.max_video) as executor:
        future_to_video = {executor.submit(fetch_video_transcript, v): v for v in videos}
        for future in as_completed(future_to_video):
            results.append(future.result())

    logger.info("Search completed. Found %d transcripts.", len(results))

    return {
        "query": request.query,
        "count": len(results),
        "results": results
    }

@router.post("/discover")
def discover_youtube(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
        
    logger.info("Incoming discover request: %s (max_video=%d)", request.query, request.max_video)
    
    videos = YouTubeSearchService.search(request.query, request.max_video)
    
    if not videos:
        return {
            "query": request.query,
            "count": 0,
            "results": []
        }

    return {
        "query": request.query,
        "count": len(videos),
        "results": videos
    }
