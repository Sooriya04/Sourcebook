import time

from fastapi import APIRouter, HTTPException

from logger import logger
from models import VideoRequest
from services.transcript import TranscriptService

from youtube_transcript_api import (
    NoTranscriptFound,
    TranscriptsDisabled,
)

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

    except Exception:

        logger.exception("Unexpected error")

        raise HTTPException(
            status_code=500,
            detail="Internal Server Error",
        )
