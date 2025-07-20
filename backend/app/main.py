from fastapi import FastAPI, Request , APIRouter
from fastapi.middleware.cors import CORSMiddleware
from .auth import router as auth_router
from .portfolio import router as portfolio_router
from .analysis import router as analysis_router
from .enhanced_analysis import router as enhanced_analysis_router
from .broker_import import router as broker_import_router
from fastapi.responses import StreamingResponse, JSONResponse
import io
from .groq_utils import ask_groq
import httpx
from fastapi import Depends
from .auth import get_current_user
from fastapi import HTTPException
import os
from sqlalchemy import inspect
from .database import Base, engine
import app.models
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(analysis_router)
app.include_router(enhanced_analysis_router)
app.include_router(broker_import_router)

#to prevent cold starts on Render 
@app.api_route("/ping", methods=["GET", "HEAD"])
def ping():
    return {"status": "ok"}
    
@app.get("/")
def read_root():
    return {"message": "Stock Portfolio Analyzer API"}
    
@app.get("/init-db")  # Optional: change to POST for safety
def init_db():
    try:
        result = subprocess.run(["python", "create_tables.py"], check=True, capture_output=True, text=True)
        return {
            "status": "✅ Tables created successfully!",
            "output": result.stdout
        }
    except subprocess.CalledProcessError as e:
        return {
            "status": "❌ Error running create_tables.py",
            "error": e.stderr
        }
async def get_order_history(user_token: str, base_url: str = "https://portfolio-analyzer-9o19.onrender.com"):
    headers = {"Authorization": f"Bearer {user_token}"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        analysis = (await client.get(f"{base_url}/portfolio/analysis", headers=headers)).json()
    orders = analysis.get("orders", [])
    order_lines = [
        f"{o['date']} | {o['type'].upper():4} | {o['symbol']:8} | Qty: {o['quantity']:>4} | Price: {o['price']:.2f}"
        for o in orders
    ]
    order_history_str = "\n".join(order_lines)
    return order_history_str

@app.post("/api/ai/summary")
async def summarize_portfolio(request: Request, current_user=Depends(get_current_user)):
    user_token = request.headers.get("authorization")
    if not user_token:
        return JSONResponse({"error": "Missing authorization token"}, status_code=401)
    # Remove 'Bearer ' prefix if present
    if user_token.lower().startswith("bearer "):
        user_token = user_token[7:]
    order_history = await get_order_history(user_token)
    if not order_history.strip():
        return {"summary": ""}  # Or you can return a message like "No orders found for this user."
    prompt = (
        "You are a financial assistant. Analyze the following order history for the user.\n\n"
        "Your response MUST have exactly two sections, in this order:\n"
        "1. Behavioral Insights\n2. Personalized Suggestions\n\n"
        "For each section:\n"
        "- Start with the section heading (e.g., 'Behavioral Insights:'), then provide only relevant bullet points.\n"
        "- Do NOT include the heading for the second section as a bullet in the first section.\n"
        "- Do NOT include any introductory or transition text.\n"
        "- Do NOT repeat or mix content between the two sections.\n"
        "- Do NOT include a portfolio performance summary.\n"
        "- Use clear, non-technical language.\n\n"
        f"Order history:\n{order_history}\n\nYour response:"
    )
    summary = ask_groq(prompt)
    return {"summary": summary} 
