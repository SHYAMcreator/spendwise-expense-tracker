# SpendWise — Expense Tracker

A full-stack personal expense tracker built with React, Vite, FastAPI, SQLAlchemy, and SQLite.

## Features
- Add and delete expenses
- Categorize spending and select payment methods
- Dashboard totals and current-month category breakdown
- Search expenses and filter by category
- Persistent SQLite database
- Responsive dashboard UI

## Requirements
- Python 3.10+
- Node.js 18+

## Run the backend (Windows PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Backend API docs: http://127.0.0.1:8000/docs

## Run the frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

If PowerShell blocks activation, you can skip activation and use:
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

## API endpoints
- `GET /api/expenses` — list expenses; optional `category` and `search`
- `POST /api/expenses` — create expense
- `DELETE /api/expenses/{expense_id}` — delete expense
- `GET /api/summary` — summary totals and category breakdown

## Portfolio description
**SpendWise — Personal Expense Tracker**  
Built a responsive full-stack expense tracking application with React and FastAPI. Implemented REST APIs, SQLite persistence, category-based filtering, transaction search, and a spending dashboard with monthly summaries.
