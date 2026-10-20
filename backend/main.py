from datetime import date, datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Date, Float, Integer, String, create_engine, desc
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DB_PATH = Path(__file__).parent / "expenses.db"
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

class Expense(Base):
    __tablename__ = "expenses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(40), default="Card")
    notes: Mapped[str] = mapped_column(String(500), default="")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SpendWise Expense Tracker", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    amount: float = Field(gt=0)
    category: str = Field(min_length=1, max_length=60)
    expense_date: date
    payment_method: str = "Card"
    notes: str = ""

class ExpenseOut(ExpenseCreate):
    id: int
    class Config:
        from_attributes = True

def serialize(expense: Expense):
    return {
        "id": expense.id, "title": expense.title, "amount": expense.amount,
        "category": expense.category, "expense_date": expense.expense_date.isoformat(),
        "payment_method": expense.payment_method, "notes": expense.notes
    }

@app.get("/")
def root():
    return {"message": "SpendWise API is running"}

@app.get("/api/expenses")
def list_expenses(category: Optional[str] = None, search: Optional[str] = None):
    with SessionLocal() as db:
        query = db.query(Expense)
        if category and category != "All":
            query = query.filter(Expense.category == category)
        if search:
            query = query.filter(Expense.title.ilike(f"%{search}%"))
        rows = query.order_by(desc(Expense.expense_date), desc(Expense.id)).all()
        return [serialize(row) for row in rows]

@app.post("/api/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(payload: ExpenseCreate):
    with SessionLocal() as db:
        expense = Expense(**payload.model_dump())
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return serialize(expense)

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int):
    with SessionLocal() as db:
        expense = db.get(Expense, expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        db.delete(expense)
        db.commit()
        return {"message": "Expense deleted"}

@app.get("/api/summary")
def summary():
    with SessionLocal() as db:
        rows = db.query(Expense).all()
        today = date.today()
        this_month = [r for r in rows if r.expense_date.year == today.year and r.expense_date.month == today.month]
        total = sum(r.amount for r in rows)
        month_total = sum(r.amount for r in this_month)
        categories = {}
        for row in this_month:
            categories[row.category] = categories.get(row.category, 0) + row.amount
        top_category = max(categories, key=categories.get) if categories else "—"
        return {
            "total_spent": round(total, 2),
            "month_spent": round(month_total, 2),
            "expense_count": len(rows),
            "top_category": top_category,
            "category_breakdown": [{"category": k, "amount": round(v, 2)} for k, v in sorted(categories.items(), key=lambda x: x[1], reverse=True)]
        }
