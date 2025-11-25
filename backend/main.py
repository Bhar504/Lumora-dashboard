from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import io

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Available YOLO11 models
AVAILABLE_MODELS = {
    "yolo11n": "yolo11n.pt",  # Nano
    "yolo11s": "yolo11s.pt",  # Small
    "yolo11m": "yolo11m.pt",  # Medium
    "yolo11l": "yolo11l.pt",  # Large
    "yolo11x": "yolo11x.pt",  # Extra Large
}

# Global state for the current model
current_model_name = "yolo11n"
model = None

def load_model(model_name: str):
    global model, current_model_name
    try:
        if model_name not in AVAILABLE_MODELS:
            raise ValueError(f"Model {model_name} not found")
        
        print(f"Loading model: {model_name}...")
        model = YOLO(AVAILABLE_MODELS[model_name])
        current_model_name = model_name
        print(f"Model {model_name} loaded successfully.")
        return True
    except Exception as e:
        print(f"Error loading model {model_name}: {e}")
        return False

# Initial model load
load_model(current_model_name)

class ModelSwitchRequest(BaseModel):
    model_name: str

@app.get("/")
def read_root():
    return {"message": "YOLO11 + OpenCV Backend is running"}

@app.get("/models")
def get_models():
    return {
        "current_model": current_model_name,
        "available_models": list(AVAILABLE_MODELS.keys())
    }

@app.post("/model")
def switch_model(request: ModelSwitchRequest):
    if request.model_name not in AVAILABLE_MODELS:
        raise HTTPException(status_code=400, detail="Invalid model name")
    
    if request.model_name == current_model_name:
        return {"message": f"Model is already {current_model_name}"}

    success = load_model(request.model_name)
    if success:
        return {"message": f"Switched to {request.model_name}", "current_model": current_model_name}
    else:
        raise HTTPException(status_code=500, detail="Failed to load model")

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    if model is None:
        return JSONResponse(content={"error": "Model not loaded"}, status_code=500)

    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Run inference
        results = model(img)
        
        detections = []
        for result in results:
            # Plot results on the image
            annotated_frame = result.plot()
            
            # Convert annotated image to base64 for display
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            img_str = base64.b64encode(buffer).decode('utf-8')
            
            # Extract detection data
            for box in result.boxes:
                detections.append({
                    "class": result.names[int(box.cls)],
                    "confidence": float(box.conf),
                    "bbox": box.xyxy.tolist()[0]
                })

        return {
            "detections": detections,
            "image": f"data:image/jpeg;base64,{img_str}"
        }

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
