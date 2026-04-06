import motor.motor_asyncio
import urllib.parse
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Fetch from .env
USERNAME = os.getenv("MONGO_USERNAME")
PASSWORD = os.getenv("MONGO_PASSWORD")
CLUSTER_URL = os.getenv("MONGO_CLUSTER")

MAIN_AUTH_DB_NAME = os.getenv("MAIN_AUTH_DB_NAME")
SCHOOL_DB_NAME = os.getenv("SCHOOL_DB_NAME")

# Safety check
if not USERNAME or not PASSWORD or not CLUSTER_URL:
    print("❌ Missing environment variables. Check your .env file.")
    sys.exit(1)

# Encode password
ESCAPED_PASSWORD = urllib.parse.quote_plus(PASSWORD)

# Mongo URI
MONGO_DETAILS = f"mongodb+srv://{USERNAME}:{ESCAPED_PASSWORD}@{CLUSTER_URL}/?retryWrites=true&w=majority&appName=Cluster0"

# Connect to MongoDB
try:
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
    client.admin.command('ping')

    print("---")
    print("✅ SUCCESS: Connected to MongoDB!")
    print("---")

except Exception as e:
    print("---")
    print("❌ FATAL ERROR: Could not connect to MongoDB.")
    print("Check your credentials & IP whitelist.")
    print(f"Error: {e}")
    print("---")
    sys.exit(1)

# Dependency
async def get_db_client():
    yield client