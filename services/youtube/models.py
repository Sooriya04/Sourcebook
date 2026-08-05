from pydantic import BaseModel, HttpUrl


class VideoRequest(BaseModel):
    url: HttpUrl

class SearchRequest(BaseModel):
    query: str
    max_video: int = 5
