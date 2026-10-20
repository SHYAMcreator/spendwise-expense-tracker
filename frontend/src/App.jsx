import { useEffect, useMemo, useState } from "react";
import { Wallet, Plus, Search, Trash2, ArrowUpRight, ReceiptText, TrendingUp, PieChart, CalendarDays, X, CreditCard, Coffee, Car, ShoppingBag, HeartPulse, Home, CircleDollarSign } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const categories = ["Food", "Transport", "Shopping", "Bills", "Health", "Education", "Entertainment", "Other"];
const colors = ["#7765e3", "#29a88c", "#ed9c52", "#e66b86", "#5d91e8", "#9b76c9", "#4aafbd", "#8b96a8"];
const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const today = new Date().toISOString().slice(0, 10);
const categoryIcon = { Food: Coffee, Transport: Car, Shopping: ShoppingBag, Bills: Home, Health: HeartPulse, Education: ReceiptText, Entertainment: PieChart, Other: CircleDollarSign };

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total_spent: 0, month_spent: 0, expense_count: 0, top_category: "—", category_breakdown: [] });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", amount: "", category: "Food", expense_date: today, payment_method: "UPI", notes: "" });

  async function loadData() {
    try {
      setError("");
      const [expenseRes, summaryRes] = await Promise.all([
        fetch(`${API}/api/expenses`), fetch(`${API}/api/summary`)
      ]);
      if (!expenseRes.ok || !summaryRes.ok) throw new Error("Could not load data. Check that the backend is running.");
      setExpenses(await expenseRes.json());
      setSummary(await summaryRes.json());
    } catch (e) { setError(e.message || "Unable to connect to the API."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => expenses.filter(e =>
    (category === "All" || e.category === category) &&
    e.title.toLowerCase().includes(search.toLowerCase())
  ), [expenses, category, search]);

  async function addExpense(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/api/expenses`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail?.[0]?.msg || data.detail || "Could not save expense.");
      }
      setForm({ title: "", amount: "", category: "Food", expense_date: today, payment_method: "UPI", notes: "" });
      setShowForm(false);
      await loadData();
    } catch (e) { setError(String(e.message || e)); }
  }

  async function removeExpense(id) {
    if (!confirm("Delete this expense?")) return;
    try {
      const response = await fetch(`${API}/api/expenses/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete expense.");
      await loadData();
    } catch (e) { setError(e.message); }
  }

  const maxCategory = Math.max(...summary.category_breakdown.map(c => c.amount), 1);
  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><Wallet size={21}/></span><span>spend<span className="brand-light">wise</span></span></div>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><PieChart size={17}/> Overview</button>
      <button className="nav-item" onClick={() => document.getElementById("transactions")?.scrollIntoView({ behavior: "smooth" })}><ReceiptText size={17}/> Transactions</button>
      <div className="side-bottom"><div className="avatar">SW</div><div><b>My finances</b><small>Personal workspace</small></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><p className="eyebrow">MONDAY, YOUR MONEY AT A GLANCE</p><h1>Good evening 👋</h1><p className="subhead">Here’s what’s happening with your spending.</p></div><button className="primary" onClick={() => setShowForm(true)}><Plus size={17}/> Add expense</button></header>
      {error && <div className="error"><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}
      <section className="stats">
        <article className="stat-card"><div className="stat-head"><span>Total spent</span><span className="stat-icon purple"><Wallet size={18}/></span></div><h2>{money(summary.total_spent)}</h2><div className="stat-foot"><span className="dot purple-dot"/> All recorded expenses</div></article>
        <article className="stat-card"><div className="stat-head"><span>This month</span><span className="stat-icon green"><TrendingUp size={18}/></span></div><h2>{money(summary.month_spent)}</h2><div className="stat-foot"><span className="positive"><ArrowUpRight size={14}/> Monthly total</span></div></article>
        <article className="stat-card"><div className="stat-head"><span>Transactions</span><span className="stat-icon orange"><ReceiptText size={18}/></span></div><h2>{summary.expense_count}</h2><div className="stat-foot">Expenses tracked</div></article>
        <article className="stat-card"><div className="stat-head"><span>Top category</span><span className="stat-icon pink"><PieChart size={18}/></span></div><h2 className="category-stat">{summary.top_category}</h2><div className="stat-foot">Highest this month</div></article>
      </section>

      <section className="content-grid">
        <article className="panel breakdown"><div className="panel-title"><div><h3>Spending by category</h3><p>Your monthly spending breakdown</p></div><span className="pill"><CalendarDays size={13}/> This month</span></div>
          {summary.category_breakdown.length ? <div className="category-list">{summary.category_breakdown.map((item, i) => <div className="category-row" key={item.category}><div className="category-info"><span className="category-dot" style={{background: colors[i % colors.length]}}/>{item.category}<b>{money(item.amount)}</b></div><div className="bar-track"><div className="bar-fill" style={{width: `${Math.max(item.amount / maxCategory * 100, 3)}%`, background: colors[i % colors.length]}}/></div></div>)}</div> : <div className="empty-small"><div className="empty-icon"><PieChart size={23}/></div><b>No spending to chart yet</b><span>Add your first expense to see the breakdown.</span></div>}
        </article>
        <article className="panel tip-panel"><div className="tip-icon"><TrendingUp size={21}/></div><span className="tip-label">SPENDING INSIGHT</span><h3>{summary.expense_count ? `You’ve tracked ${summary.expense_count} expenses` : "Start building better money habits"}</h3><p>{summary.expense_count ? `Your highest spending category this month is ${summary.top_category}. Keep recording expenses to understand where your money goes.` : "Record your daily expenses to discover patterns, understand your habits, and make smarter financial decisions."}</p><button className="text-button" onClick={() => setShowForm(true)}>Record an expense <ArrowUpRight size={15}/></button><div className="decor-circle circle-one"/><div className="decor-circle circle-two"/></article>
      </section>

      <section className="panel transactions" id="transactions"><div className="panel-title transaction-title"><div><h3>Recent transactions</h3><p>Keep track of where your money goes</p></div><span className="count-pill">{filtered.length} records</span></div>
        <div className="filters"><div className="search-box"><Search size={16}/><input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)}/></div><select value={category} onChange={e => setCategory(e.target.value)}><option>All</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="table-wrap"><table><thead><tr><th>EXPENSE</th><th>CATEGORY</th><th>DATE</th><th>PAYMENT</th><th className="amount-col">AMOUNT</th><th></th></tr></thead><tbody>
          {loading ? <tr><td colSpan="6" className="table-empty">Loading expenses…</td></tr> : filtered.length ? filtered.map(exp => { const Icon = categoryIcon[exp.category] || CircleDollarSign; return <tr key={exp.id}><td><div className="expense-name"><span className="expense-icon"><Icon size={17}/></span><div><b>{exp.title}</b>{exp.notes && <small>{exp.notes}</small>}</div></div></td><td><span className="category-badge">{exp.category}</span></td><td>{new Date(exp.expense_date + "T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td><td>{exp.payment_method}</td><td className="amount-col amount">{money(exp.amount)}</td><td><button className="icon-button" title="Delete expense" onClick={() => removeExpense(exp.id)}><Trash2 size={15}/></button></td></tr> }) : <tr><td colSpan="6"><div className="table-empty"><div className="empty-icon"><ReceiptText size={23}/></div><b>No expenses found</b><span>Add an expense or change your filters.</span><button className="text-button" onClick={() => setShowForm(true)}>Add your first expense <ArrowUpRight size={15}/></button></div></td></tr>}
        </tbody></table></div>
      </section>
      <footer>SpendWise <span>•</span> Built with React, FastAPI & SQLite</footer>
    </main>

    {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}><div className="modal"><div className="modal-head"><div><span className="eyebrow">NEW TRANSACTION</span><h2>Add an expense</h2></div><button className="icon-button close-button" onClick={() => setShowForm(false)}><X size={19}/></button></div><form onSubmit={addExpense}>
      <label>Expense name<input required maxLength="140" placeholder="e.g. Weekly groceries" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></label>
      <div className="form-row"><label>Amount (₹)<input required type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})}/></label><label>Date<input required type="date" value={form.expense_date} onChange={e => setForm({...form,expense_date:e.target.value})}/></label></div>
      <div className="form-row"><label>Category<select value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Payment method<select value={form.payment_method} onChange={e => setForm({...form,payment_method:e.target.value})}>{["UPI","Card","Cash","Bank transfer","Other"].map(c => <option key={c}>{c}</option>)}</select></label></div>
      <label>Notes (optional)<textarea rows="2" placeholder="Add a short note…" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})}/></label>
      <div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary"><Plus size={16}/> Save expense</button></div>
    </form></div></div>}
  </div>;
}
