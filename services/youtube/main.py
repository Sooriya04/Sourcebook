from fastapi import FastAPI

from config import settings
from routes.youtube import router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
)

app.include_router(
    router,
    prefix="/youtube",
    tags=["YouTube"],
)


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
    }
