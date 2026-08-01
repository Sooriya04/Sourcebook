import logging
import sys
from logging.handlers import RotatingFileHandler

def setup_logger():
    logger = logging.getLogger("sourcebook.youtube")
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)

    import os
    os.makedirs("logs", exist_ok=True)
    file_handler = RotatingFileHandler(
        "logs/youtube.log",
        maxBytes = 10 * 1024 * 1024,
        backupCount = 5
    )
    file_handler.setFormatter(formatter)

    return logger


logger = setup_logger()
