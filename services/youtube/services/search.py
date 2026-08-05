import yt_dlp

class YouTubeSearchService:
    @staticmethod
    def search(query: str, max_results: int):
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
