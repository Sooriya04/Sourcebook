from urllib.parse import urlparse, parse_qs

from youtube_transcript_api import (
    YouTubeTranscriptApi,
    NoTranscriptFound,
    TranscriptsDisabled,
)


class TranscriptService:

    @staticmethod
    def extract_video_id(url: str):

        parsed = urlparse(url)

        if parsed.hostname == "youtu.be":
            return parsed.path[1:]

        if parsed.hostname in (
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
        ):
            if parsed.path.startswith("/shorts/"):
                return parsed.path.split("/")[2]
            
            query = parse_qs(parsed.query)
            if "v" in query:
                return query["v"][0]

        return url

    @classmethod
    def fetch(cls, url: str):

        video_id = cls.extract_video_id(url)

        api = YouTubeTranscriptApi()
        fetched = api.fetch(video_id)

        transcript = [
            {
                "text": s.text,
                "start": s.start,
                "duration": s.duration
            }
            for s in fetched.snippets
        ]

        return {
            "video_id": fetched.video_id,
            "segments": len(transcript),
            "language": fetched.language,
            "transcript": transcript,
            "text": " ".join(t["text"] for t in transcript),
        }
