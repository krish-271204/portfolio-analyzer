# Portfolio Analyzer

A modern, full-stack portfolio analysis web application with AI-powered behavioral insights and personalized suggestions.

## Features

- **AI Insights & Recommendations:**
  - Uses Groq LLM API to analyze your trading history and provide behavioral insights and personalized suggestions.
  - Insights are displayed in a beautiful, theme-consistent UI with icons and bullet points.
- **Portfolio Management:**
  - Import, view, and analyze your stock portfolio.
  - Visualizations for sector and market cap allocation.
- **Authentication:**
  - Secure JWT-based authentication for multi-user support.
- **Modern Tech Stack:**
  - **Frontend:** React (with Tailwind CSS, react-markdown, react-icons)
  - **Backend:** FastAPI (Python, async, Pydantic, JWT)
  - **Database:** PostgreSQL

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repo-url>
cd portfolio
```

### 2. Backend Setup
- Create a virtual environment and install dependencies:
  ```bash
  cd backend
  python -m venv venv
  source venv/bin/activate  # or venv\Scripts\activate on Windows
  pip install -r app/requirements.txt
  ```
- Set up your PostgreSQL database and update the `DATABASE_URL` in your environment variables or `.env` file.
- **Set your Groq API key as an environment variable:**
  ```bash
  export GROQ_API_KEY=your-groq-api-key  # Linux/macOS
  # or
  set GROQ_API_KEY=your-groq-api-key     # Windows CMD
  # or
  $env:GROQ_API_KEY="your-groq-api-key" # Windows PowerShell
  ```
- Start the backend:
  ```bash
  uvicorn app.main:app --reload
  ```

### 3. Frontend Setup
- Install dependencies:
  ```bash
  cd frontend
  npm install
  ```
- Start the frontend:
  ```bash
  npm run dev
  ```
- The app will be available at `http://localhost:5173` (or as shown in your terminal).

### 4. Usage
- Register a new user or log in.
- Import your portfolio and view AI-powered insights on the Analysis page.
- The "AI Insights & Recommendations" section will show behavioral insights and personalized suggestions, beautifully formatted with icons and bullet points.

## Environment Variables
- `DATABASE_URL`: Your PostgreSQL connection string.
- `GROQ_API_KEY`: Your Groq LLM API key for AI features.
- (Other variables as needed for JWT secret, etc.)

## Notes
- The backend uses FastAPI with async endpoints and Pydantic for validation.
- The frontend uses React, Tailwind CSS, react-markdown for markdown rendering, and react-icons for icons.
- JWT authentication enables secure, stateless, multi-user support.
- AI features require a valid Groq API key.

## License
MIT 