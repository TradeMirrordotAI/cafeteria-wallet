import { useMemo, useState } from 'react'
import {
  ArrowDownLeft, ArrowUpRight, BadgeCheck, Banknote, ChefHat, ChevronRight,
  CircleHelp, ClipboardList, Clock3, CreditCard, LayoutDashboard, LogOut,
  Plus, Printer, Search, ShoppingBag, Wallet, Utensils, X
} from 'lucide-react'
import { demoMeals, demoOrders } from './data/demo'
import type { Meal, Order, OrderStatus, Role } from './types'
import { isSupabaseConfigured } from './lib/supabase'

const money = (value: number) => `₦${value.toLocaleString('en-NG')}`

export default function App() {
  const [role, setRole] = useState<Role>('student')
  const [balance, setBalance] = useState(12500)
  const [meals, setMeals] = useState<Meal[]>(demoMeals)
  const [orders, setOrders] = useState<Order[]>(demoOrders)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')
  const [fundOpen, setFundOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('5000')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const cartItems = useMemo(() => meals.filter(m => cart[m.id]).map(m => ({ ...m, quantity: cart[m.id] })), [meals, cart])
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const filteredMeals = meals.filter(m => m.available && m.name.toLowerCase().includes(search.toLowerCase()))
  const foundOrder = orders.find(o => o.code.toLowerCase() === code.trim().toLowerCase())

  function addToCart(id: string) {
    setCart(current => ({ ...current, [id]: (current[id] || 0) + 1 }))
  }

  function checkout() {
    if (!cartItems.length) return
    if (total > balance) {
      setNotice('Your wallet balance is too low. Please fund your wallet first.')
      return
    }
    const newOrder: Order = {
      id: crypto.randomUUID(),
      code: `CB-${Math.floor(100000 + Math.random() * 900000)}`,
      receiptNumber: `CBR-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`,
      paymentReference: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      studentId: 'DEMO-001',
      studentName: 'Demo Student',
      items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      total,
      status: 'paid',
      createdAt: new Date().toISOString()
    }
    setBalance(value => value - total)
    setOrders(current => [newOrder, ...current])
    setSelectedOrder(newOrder)
    setCart({})
    setNotice('Demo order created. This does not charge a real wallet.')
  }

  function fundDemoWallet() {
    const amount = Number(fundAmount)
    if (!Number.isFinite(amount) || amount < 100) {
      setNotice('Enter an amount of at least ₦100.')
      return
    }
    setBalance(value => value + amount)
    setFundOpen(false)
    setNotice('Demo funds added. No real payment was made.')
  }

  function updateStatus(orderId: string, status: OrderStatus) {
    setOrders(current => current.map(o => o.id === orderId ? { ...o, status } : o))
  }

  function printTicket(order: Order) {
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char))
    const date = new Date(order.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
    const items = order.items.map(item => `<tr><td>${item.quantity} × ${escapeHtml(item.name)}</td><td class="amount">${money(item.price * item.quantity)}</td></tr>`).join('')
    const ticket = `<!doctype html><html><head><meta charset="utf-8"><title>CampusBite receipt ${escapeHtml(order.receiptNumber || order.code)}</title><style>
      @page{size:80mm auto;margin:5mm}*{box-sizing:border-box}body{font:12px/1.45 Arial,sans-serif;width:70mm;margin:0 auto;color:#111}header{text-align:center;border-bottom:1px dashed #777;padding-bottom:10px}h1{font-size:20px;margin:0 0 3px}h2{font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px}.muted{color:#555;font-size:10px}.meta{margin:10px 0}.meta div{display:flex;justify-content:space-between;gap:8px;margin:3px 0}.code{border:1px dashed #333;padding:9px;text-align:center;margin:10px 0}.code strong{display:block;font-size:23px;letter-spacing:2px}.code span{font-size:10px}.items{width:100%;border-collapse:collapse;margin:10px 0}.items th{border-bottom:1px solid #333;text-align:left;padding:5px 0}.items td{padding:5px 0;vertical-align:top}.amount{text-align:right;white-space:nowrap}.total{border-top:1px dashed #777;padding-top:8px;display:flex;justify-content:space-between;font-size:15px;font-weight:bold}.footer{text-align:center;border-top:1px dashed #777;margin-top:12px;padding-top:10px}.status{text-transform:uppercase;font-weight:bold} @media screen{body{margin:20px auto}}
    </style></head><body><header><h1>CAMPUSBITE</h1><div>School Cafeteria</div><h2>Payment Receipt</h2><div class="muted">Please keep this receipt for your records</div></header><section class="meta"><div><span>Receipt No.</span><strong>${escapeHtml(order.receiptNumber || `CBR-${order.code}`)}</strong></div><div><span>Date</span><strong>${escapeHtml(date)}</strong></div><div><span>Student</span><strong>${escapeHtml(order.studentName)}</strong></div><div><span>Student ID</span><strong>${escapeHtml(order.studentId || 'Portal ID pending')}</strong></div><div><span>Payment Ref.</span><strong>${escapeHtml(order.paymentReference || 'Pending verification')}</strong></div><div><span>Payment status</span><strong>PAID</strong></div></section><div class="code"><span>FOOD COLLECTION CODE</span><strong>${escapeHtml(order.code)}</strong><span>Present this code to cafeteria staff</span></div><table class="items"><thead><tr><th>Item</th><th class="amount">Amount</th></tr></thead><tbody>${items}</tbody></table><div class="total"><span>TOTAL PAID</span><span>${money(order.total)}</span></div><div class="meta"><div><span>Collection status</span><strong class="status">${escapeHtml(order.status)}</strong></div></div><div class="footer"><strong>Thank you!</strong><div class="muted">This receipt is generated by CampusBite.</div><div class="muted">For payment queries, contact the school cafeteria office.</div></div><script>window.onload=()=>{window.focus();window.print()}</script></body></html>`
    const win = window.open('', '_blank', 'width=460,height=760')
    if (!win) {
      setNotice('Allow pop-ups for this site to print the receipt.')
      return
    }
    win.document.open()
    win.document.write(ticket)
    win.document.close()
  }

  const navItems = role === 'student'
    ? [{ label: 'Order food', icon: Utensils }, { label: 'My orders', icon: ClipboardList }]
    : role === 'cafeteria'
      ? [{ label: 'Find order', icon: Search }, { label: 'Orders', icon: ClipboardList }]
      : [{ label: 'Overview', icon: LayoutDashboard }, { label: 'Menu management', icon: Utensils }]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Utensils size={20} /></span><span>campus<span className="brand-light">bite</span></span></div>
        <div className="school-label">SCHOOL CAFETERIA</div>
        <nav>
          {navItems.map(item => <div className="nav-item active" key={item.label}><item.icon size={18} />{item.label}</div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-link"><CircleHelp size={17} /> Help & support</div>
          <div className="profile-mini"><div className="avatar">DT</div><div><strong>{role === 'student' ? 'Demo Student' : role === 'cafeteria' ? 'Cafeteria Staff' : 'Administrator'}</strong><small>{role} account</small></div><LogOut size={16} className="logout" /></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="eyebrow">CAMPUS CAFETERIA</span><h1>{role === 'student' ? 'Good afternoon 👋' : role === 'cafeteria' ? 'Cafeteria desk' : 'Admin overview'}</h1></div>
          <div className="top-actions">
            <label className="role-switch"><span>Preview as</span><select value={role} onChange={e => { setRole(e.target.value as Role); setNotice('') }}><option value="student">Student</option><option value="cafeteria">Cafeteria staff</option><option value="admin">Admin</option></select></label>
            <div className="avatar">DT</div>
          </div>
        </header>

        {!isSupabaseConfigured && <div className="demo-banner"><span className="demo-dot" /> Demo preview — data is temporary and stored only in this browser session. Connect Supabase before using real student accounts or payments.</div>}
        {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}

        {role === 'student' && <>
          <section className="wallet-card">
            <div className="wallet-top"><div><span className="muted-light">AVAILABLE BALANCE</span><div className="balance">{money(balance)}</div></div><div className="wallet-icon"><Wallet size={24} /></div></div>
            <div className="wallet-bottom"><span>Student wallet</span><button className="fund-button" onClick={() => setFundOpen(true)}><Plus size={16} /> Fund wallet</button></div>
          </section>
          <div className="section-heading"><div><h2>Today's menu</h2><p>Choose what you'd like to eat.</p></div><div className="searchbox"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meals" /></div></div>
          <div className="meal-grid">
            {filteredMeals.map(meal => <article className="meal-card" key={meal.id}><div className="meal-image">{meal.emoji}</div><div className="meal-info"><span className="meal-category">{meal.category}</span><h3>{meal.name}</h3><p>{meal.description}</p><div className="meal-bottom"><strong>{money(meal.price)}</strong><button className="add-button" onClick={() => addToCart(meal.id)}><Plus size={15} /> Add</button></div></div></article>)}
          </div>
          {cartItems.length > 0 && <section className="cart-panel"><div><strong>{cartItems.reduce((s, i) => s + i.quantity, 0)} items in your order</strong><span>{money(total)}</span></div><button className="primary-button" onClick={checkout}>Place order <ChevronRight size={17} /></button></section>}
          <section className="recent-section"><div className="section-heading"><div><h2>Recent orders</h2><p>Your latest cafeteria purchases.</p></div></div><OrderList orders={orders.filter(o => o.studentName === 'Demo Student' || o.studentName === 'Daniel T.').slice(0, 3)} onSelect={setSelectedOrder} /></section>
        </>}

        {role === 'cafeteria' && <>
          <div className="stats-row"><Stat icon={<ClipboardList />} label="Orders today" value={String(orders.length)} /><Stat icon={<Clock3 />} label="Awaiting collection" value={String(orders.filter(o => o.status !== 'collected').length)} /><Stat icon={<BadgeCheck />} label="Collected" value={String(orders.filter(o => o.status === 'collected').length)} /></div>
          <section className="content-card lookup-card"><div><h2>Find a student order</h2><p>Enter the collection code provided by the student.</p></div><div className="lookup-input"><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. CB-482915" /><button className="primary-button" onClick={() => setSelectedOrder(foundOrder || null)}>Find order</button></div>
            {code && !foundOrder && <p className="field-hint">No matching order found. Check the code and try again.</p>}
            {selectedOrder && <div className="found-order"><div className="found-order-top"><div><span className="meal-category">ORDER FOUND</span><h3>{selectedOrder.code}</h3><p>{selectedOrder.studentName}</p></div><Status status={selectedOrder.status} /></div><div className="order-items">{selectedOrder.items.map((i, index) => <div key={index}><span>{i.quantity} × {i.name}</span><strong>{money(i.price * i.quantity)}</strong></div>)}</div><div className="order-total"><span>Total paid</span><strong>{money(selectedOrder.total)}</strong></div><button className="primary-button print-button" onClick={() => printTicket(selectedOrder)}><Printer size={17} /> Print receipt / ticket</button>{selectedOrder.status !== 'collected' && <button className="secondary-button full-button" onClick={() => updateStatus(selectedOrder.id, 'collected')}>Mark as collected</button>}</div>}
          </section>
          <section className="recent-section"><div className="section-heading"><div><h2>All orders</h2><p>Recent orders placed by students.</p></div></div><OrderList orders={orders} onSelect={order => { setSelectedOrder(order); setCode(order.code) }} /></section>
        </>}

        {role === 'admin' && <>
          <div className="stats-row"><Stat icon={<Banknote />} label="Sales today" value={money(orders.reduce((s, o) => s + o.total, 0))} /><Stat icon={<ClipboardList />} label="Total orders" value={String(orders.length)} /><Stat icon={<Utensils />} label="Menu items" value={String(meals.length)} /></div>
          <section className="content-card"><div className="section-heading"><div><h2>Menu management</h2><p>Manage meals available to students.</p></div></div>{meals.map(meal => <div className="menu-row" key={meal.id}><span className="menu-emoji">{meal.emoji}</span><div className="menu-name"><strong>{meal.name}</strong><small>{meal.category}</small></div><strong>{money(meal.price)}</strong><label className="toggle"><input type="checkbox" checked={meal.available} onChange={e => setMeals(current => current.map(m => m.id === meal.id ? { ...m, available: e.target.checked } : m))} /><span /></label></div>)}</section>
        </>}
        <footer>CampusBite <span>•</span> Simple school cafeteria ordering</footer>
      </main>

      {fundOpen && <div className="modal-backdrop" onClick={() => setFundOpen(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setFundOpen(false)}><X size={18} /></button><div className="modal-icon"><Wallet size={22} /></div><h2>Fund your wallet</h2><p>Add money to your cafeteria wallet to pay for meals.</p><label className="input-label">Amount (₦)</label><input className="amount-input" value={fundAmount} onChange={e => setFundAmount(e.target.value)} type="number" min="100" /><div className="fund-methods"><div><CreditCard size={18} /><span>Debit card</span></div><div><ArrowDownLeft size={18} /><span>Bank transfer</span></div></div><button className="primary-button full-button" onClick={fundDemoWallet}>Continue</button><small className="modal-note">Demo only: payment gateway will be connected in a later step.</small></div></div>}

      {selectedOrder && role === 'student' && <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}><div className="modal order-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSelectedOrder(null)}><X size={18} /></button><div className="modal-icon success"><BadgeCheck size={22} /></div><h2>Order placed!</h2><p>Your order confirmation and receipt details are ready. Save your collection code and show it to cafeteria staff.</p><div className="collection-code">{selectedOrder.code}</div><p className="receipt-ref">Receipt: {selectedOrder.receiptNumber || `CBR-${selectedOrder.code}`}</p><button className="secondary-button full-button" onClick={() => navigator.clipboard.writeText(selectedOrder.code)}>Copy collection code</button><button className="primary-button full-button" onClick={() => printTicket(selectedOrder)}><Printer size={17} /> Print receipt</button><div className="modal-note">Keep this code safe until you collect your food.</div></div></div>}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>
}

function Status({ status }: { status: OrderStatus }) {
  const labels: Record<OrderStatus, string> = { paid: 'Paid', preparing: 'Preparing', ready: 'Ready', collected: 'Collected' }
  return <span className={`status status-${status}`}>{labels[status]}</span>
}

function OrderList({ orders, onSelect }: { orders: Order[]; onSelect: (order: Order) => void }) {
  if (!orders.length) return <div className="empty-state">No orders yet.</div>
  return <div className="orders-list">{orders.map(order => <button className="order-row" key={order.id} onClick={() => onSelect(order)}><div className="order-icon"><ShoppingBag size={18} /></div><div className="order-main"><strong>{order.code}</strong><small>{order.items.map(i => `${i.quantity} × ${i.name}`).join(', ')}</small></div><div className="order-right"><strong>{money(order.total)}</strong><Status status={order.status} /></div><ChevronRight size={17} className="row-chevron" /></button>)}</div>
}
