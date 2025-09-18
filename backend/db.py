import motor.motor_asyncio
import urllib.parse
import sys
from pymongo.mongo_client import MongoClient


USERNAME = "girish63862829" 

PASSWORD = "Girish@6386" 

CLUSTER_URL = "cluster0.vcwci7d.mongodb.net"


ESCAPED_PASSWORD = urllib.parse.quote_plus(PASSWORD)

MONGO_DETAILS = f"mongodb+srv://{USERNAME}:{ESCAPED_PASSWORD}@{CLUSTER_URL}/?retryWrites=true&w=majority&appName=Cluster0"


try:
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
    client.admin.command('ping') 
    db = client.school_db
    print("---")
    print("SUCCESS: Connected to MongoDB!")
    print("---")
except Exception as e:
    print("---")
    print(f"FATAL ERROR: Could not connect to MongoDB.")
    print(f"Please check your USERNAME, PASSWORD, and IP Whitelist.")
    print(f"Error details: {e}")
    print("---")
    sys.exit(1) 
async def get_db():
    yield db