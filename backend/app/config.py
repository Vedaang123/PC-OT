import os
import sys
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    CSV_FILE = os.getenv("DATABASE_LOC")
    CHUNK_SIZE = 512
    K_RETRIEVAL = 3
    MODEL_NAME = "gemini-2.5-flash"
    

    EMBEDDING_MODEL = "models/gemini-embedding-001"

    def validate(self):
        if not self.GEMINI_API_KEY:
            print("FATAL ERROR: GEMINI_API_KEY not found.")
            sys.exit(1)
        if not self.CSV_FILE:
            print("FATAL ERROR: DATABASE_LOC not found.")
            sys.exit(1)

settings = Settings()
settings.validate()