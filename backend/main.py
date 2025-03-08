import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time
from datetime import datetime

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stopwatch state
class StopwatchState:
    def __init__(self):
        self.start_time = None
        self.elapsed_time = 0
        self.is_running = False
        self.time_records = []  # List to store elapsed times
        self.thoughts = []  # List to store user thoughts

# Initialize stopwatch
stopwatch = StopwatchState()

memory_db = stopwatch.elapsed_time
print(memory_db)

# Request models
class ThoughtRequest(BaseModel):
    thought: str
    record_id: int

# Request models
class ThoughtsResponse(BaseModel):
    thoughts: List[str]


# Response models
class StopwatchResponse(BaseModel):
    elapsed_time: float
    is_running: bool
    formatted_time: str

class TimeRecord(BaseModel):
    id: int
    elapsed_time: float
    formatted_time: str
    timestamp: str
    thought: Optional[str] = None

class TimeRecordsResponse(BaseModel):
    records: List[TimeRecord]

# Helper function to format time
def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = seconds % 60
    return f"{hours:02d}:{minutes:02d}{seconds:06.3f}"

@app.get("/")
async def root():
    return {"message": "Stopwatch API is running"}

@app.post("/api/stopwatch/start", response_model=StopwatchResponse)
async def start_stopwatch():
    if not stopwatch.is_running:
        stopwatch.start_time = time.time()
        stopwatch.is_running = True
    
    elapsed = stopwatch.elapsed_time
    if stopwatch.is_running:
        elapsed += time.time() - stopwatch.start_time
    
    return {
        "elapsed_time": elapsed,
        "is_running": stopwatch.is_running,
        "formatted_time": format_time(elapsed)
    }

@app.post("/api/stopwatch/stop", response_model=StopwatchResponse)
async def stop_stopwatch():
    if stopwatch.is_running:
        current_time = time.time()
        total_elapsed = stopwatch.elapsed_time + (current_time - stopwatch.start_time)
        stopwatch.elapsed_time = total_elapsed
        stopwatch.is_running = False
        
        # Store the elapsed time record
        record_id = len(stopwatch.time_records)
        stopwatch.time_records.append({
            "id": record_id,
            "elapsed_time": total_elapsed,
            "formatted_time": format_time(total_elapsed),
            "timestamp": datetime.now().isoformat(),
            "thought": None
        })
    
    return {
        "elapsed_time": stopwatch.elapsed_time,
        "is_running": stopwatch.is_running,
        "formatted_time": format_time(stopwatch.elapsed_time)
    }

@app.post("/api/stopwatch/reset", response_model=StopwatchResponse)
async def reset_stopwatch():
    stopwatch.start_time = time.time() if stopwatch.is_running else None
    stopwatch.elapsed_time = 0
    
    return {
        "elapsed_time": 0,
        "is_running": stopwatch.is_running,
        "formatted_time": format_time(0)
    }

@app.get("/api/stopwatch/time", response_model=StopwatchResponse)
async def get_stopwatch_time():
    elapsed = stopwatch.elapsed_time
    if stopwatch.is_running:
        elapsed += time.time() - stopwatch.start_time
    
    return {
        "elapsed_time": elapsed,
        "is_running": stopwatch.is_running,
        "formatted_time": format_time(elapsed)
    }

@app.get("/api/stopwatch/records", response_model=TimeRecordsResponse)
async def get_time_records():
    return {
        "records": stopwatch.time_records
    }

@app.get("/api/stopwatch/thoughts", response_model=ThoughtsResponse)
async def get_thoughts():
    return {
        "thoughts": stopwatch.thoughts
    }

@app.delete("/api/stopwatch/records")
async def clear_time_records():
    stopwatch.time_records = []
    return {"message": "All time records cleared"}

@app.post("/api/stopwatch/thought")
async def add_thought(thought_request: ThoughtRequest):
    record_id = thought_request.record_id
    
    # Find the record and update it with the thought
    for record in stopwatch.time_records:
        if record["id"] == record_id:
            record["thought"] = thought_request.thought
            return {"message": "Thought added successfully"}
    
    return {"message": "Record not found"}, 404



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

