import { useState, useEffect } from 'react';

/** Fetch JSON; on error or non-array for list routes, return fallback (never throws). */
async function apiJson(path, opts, fallback = null) {
  try {
    const res = await fetch(path, { ...opts, headers: { Accept: 'application/json', ...opts?.headers } });
    const text = await res.text();
    let data;
    try {
      data = text && text.trim() ? JSON.parse(text) : null;
    } catch {
      console.error('API not JSON:', path, res.status, text?.slice(0, 200));
      return fallback;
    }
    if (!res.ok) {
      console.error('API error:', path, res.status, data);
      return fallback;
    }
    return data;
  } catch (e) {
    console.error('API fetch failed:', path, e);
    return fallback;
  }
}

export default function App() {
  const [tab, setTab]           = useState('shop');
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [activeCat, setActiveCat]   = useState(null);
  const [cart, setCart]             = useState([]);
  const [orders, setOrders]         = useState([]);
  const [form, setForm]             = useState({ name: '', email: '' });
  const [msg, setMsg]               = useState('');

  useEffect(() => {
    (async () => {
      const [cats, prods] = await Promise.all([
        apiJson('/categories', undefined, []),
        apiJson('/products', undefined, []),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
    })();
  }, []);

  const visibleProducts = activeCat
    ? products.filter(p => p.category_id === activeCat)
    : products;

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      return existing
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  async function placeOrder(e) {
    e.preventDefault();
    if (!cart.length) return;
    const order = {
      customer_name:  form.name,
      customer_email: form.email,
      items: cart.map(i => ({ product_id: i.id, name: i.name, price: i.price, qty: i.qty })),
      total: cartTotal,
    };
    const res = await apiJson('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }, null);
    if (res && res.id) {
      setMsg(`Order placed! ID: ${res.id}`);
      setCart([]);
      setForm({ name: '', email: '' });
    } else {
      setMsg('Could not place order. Is the order service running?');
    }
  }

  async function loadOrders() {
    const data = await apiJson('/orders', undefined, []);
    setOrders(Array.isArray(data) ? data : []);
  }

  return (
    <div className="app-shell">
      <header>
        <h1>🛍 Best Deal Store</h1>
        <nav>
          <button className={tab === 'shop' ? 'active' : ''} onClick={() => setTab('shop')}>Shop</button>
          <button className={tab === 'cart' ? 'active' : ''} onClick={() => setTab('cart')}>
            Cart <span className="badge">{cart.reduce((s, i) => s + i.qty, 0)}</span>
          </button>
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => { setTab('orders'); loadOrders(); }}>
            My Orders
          </button>
        </nav>
      </header>

      <main>
        {/* ── Shop ── */}
        {tab === 'shop' && (
          <>
            <h2>Products</h2>
            <div className="chip-row">
              <button className={`chip ${!activeCat ? 'active' : ''}`} onClick={() => setActiveCat(null)}>All</button>
              {categories.map(c => (
                <button key={c.id} className={`chip ${activeCat === c.id ? 'active' : ''}`} onClick={() => setActiveCat(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
            {visibleProducts.length === 0 && <p className="empty">No products found.</p>}
            <div className="grid">
              {visibleProducts.map(p => (
                <div className="card" key={p.id}>
                  {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', borderRadius: 6, objectFit: 'cover', height: 140 }} />}
                  <h3>{p.name}</h3>
                  <p style={{ fontSize: '.85rem', color: '#555' }}>{p.description}</p>
                  <span className="price">${p.price.toFixed(2)}</span>
                  <span className="stock">In stock: {p.stock}</span>
                  <button className="primary" disabled={p.stock === 0} onClick={() => addToCart(p)}>
                    {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Cart ── */}
        {tab === 'cart' && (
          <>
            <h2>Your Cart</h2>
            {cart.length === 0 && <p className="empty">Your cart is empty.</p>}
            {cart.map(i => (
              <div className="cart-item" key={i.id}>
                <span>{i.name} × {i.qty}</span>
                <span>${(i.price * i.qty).toFixed(2)}</span>
                <button className="danger" onClick={() => removeFromCart(i.id)}>Remove</button>
              </div>
            ))}
            {cart.length > 0 && (
              <>
                <div className="cart-total">Total: ${cartTotal.toFixed(2)}</div>
                <h2>Checkout</h2>
                {msg && <p style={{ color: 'green', marginBottom: '1rem' }}>{msg}</p>}
                <form className="form" onSubmit={placeOrder}>
                  <label>Name</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                  <label>Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
                  <button type="submit" className="primary">Place Order</button>
                </form>
              </>
            )}
          </>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <>
            <h2>My Orders</h2>
            {orders.length === 0 && <p className="empty">No orders yet.</p>}
            {orders.map(o => (
              <div className="order-card" key={o._id || o.id}>
                <h3>{o.customer_name} — ${o.total?.toFixed(2)}</h3>
                <p style={{ fontSize: '.85rem', color: '#555', marginBottom: '.4rem' }}>{o.customer_email}</p>
                <span className={`status ${o.status}`}>{o.status}</span>
                <ul style={{ marginTop: '.6rem', paddingLeft: '1.2rem', fontSize: '.85rem' }}>
                  {o.items?.map((item, i) => <li key={i}>{item.name} × {item.qty}</li>)}
                </ul>
              </div>
            ))}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 Best Deal Store. All rights reserved.</p>
      </footer>
    </div>
  );
}
