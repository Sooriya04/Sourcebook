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
        
        # List all available transcripts for the video
        transcript_list = api.list(video_id)
        
        target_transcript = None
        # 1. Try finding English (manual or generated)
        try:
            target_transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        except NoTranscriptFound:
            try:
                target_transcript = transcript_list.find_generated_transcript(['en', 'en-US', 'en-GB'])
            except NoTranscriptFound:
                pass

        # 2. If no English transcript, grab the first available transcript
        if target_transcript is None:
            for t in transcript_list:
                target_transcript = t
                break

        if target_transcript is None:
            raise NoTranscriptFound(video_id, ['en'], transcript_list)

        # 3. Fetch native transcript directly without machine translation
        fetched = target_transcript.fetch()

        snippets = getattr(fetched, 'snippets', fetched)
        transcript = []
        for s in snippets:
            txt = getattr(s, 'text', s['text'] if isinstance(s, dict) else '')
            st = getattr(s, 'start', s['start'] if isinstance(s, dict) else 0)
            dur = getattr(s, 'duration', s['duration'] if isinstance(s, dict) else 0)
            transcript.append({"text": txt, "start": st, "duration": dur})

        return {
            "video_id": video_id,
            "segments": len(transcript),
            "language": getattr(target_transcript, 'language', 'unknown'),
            "transcript": transcript,
            "text": " ".join(t["text"] for t in transcript if t["text"]),
        }

