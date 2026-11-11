import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../renovatech-logo.jpeg';
import workbookInventory from './products.json';
import { supabaseConfigured } from './supabase.js';
import { subscribeCatalog } from './supabase-catalog.js';
import './styles.css';

const phone = '919739224269';
const formatPrice = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});
const CART_STORAGE_KEY = 'renovatech-cart-v1';

function readCart() {
  try {
    const savedCart = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(savedCart)) return [];

    return savedCart.flatMap((item) => {
      const id = String(item?.id || '');
      const quantity = Math.floor(Number(item?.quantity) || 0);
      return id && quantity > 0 ? [{ id, quantity }] : [];
    });
  } catch {
    return [];
  }
}

function createOrderId() {
  const uniquePart = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `RT-${uniquePart.replace(/[^a-z0-9]/gi, '').toUpperCase()}`;
}

function Icon({ name, className = '' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    whatsapp: <><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.1Z" /><path d="M8.5 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .6.5.9 1.3 1.6 2.2 2 .2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.3.4.5 0 .3-.2 1.1-.7 1.5-.5.5-1.1.7-1.8.6-1.1-.2-2.4-.8-3.6-1.9-1.4-1.2-2.3-2.7-2.6-3.7-.3-.9 0-1.7.4-2.2Z" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.7a15 15 0 0 0 4.8 4.8L15 13l5 2v4a2 2 0 0 1-2.2 2A18 18 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />,
    cart: <><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    trash: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="m5 7 1 13h12l1-13" /><path d="M9 7V4h6v3" /></>
  };

  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function LaptopIllustration({ product, index }) {
  const gradientId = `screen-${product.id}`;
  return (
    <svg className="laptop-illustration" viewBox="0 0 320 220" role="img" aria-label={`${product.model} laptop illustration`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={index % 3 === 0 ? '#173d34' : index % 3 === 1 ? '#274d69' : '#57412a'} />
          <stop offset="1" stopColor={index % 3 === 0 ? '#1d7960' : index % 3 === 1 ? '#66a897' : '#bb8d4c'} />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="190" rx="118" ry="12" fill="#18382b" opacity=".13" />
      <rect x="63" y="29" width="194" height="135" rx="12" fill="#233a39" />
      <rect x="71" y="37" width="178" height="118" rx="6" fill={`url(#${gradientId})`} />
      <circle cx="160" cy="32" r="1.7" fill="#9ab0a2" />
      <path d="M86 120c25-36 44-37 66-10 19-42 48-49 81-22v67H86z" fill="#dbedbd" opacity=".2" />
      <path d="M148 111c-1-19 4-35 17-48 3 14 1 27-7 38 8-11 20-17 36-19-7 15-19 23-36 25 15 0 27 5 35 16-18 5-34 1-45-12-11 13-27 17-45 12 8-11 20-16 35-16-17-2-29-10-36-25 16 2 28 8 36 19-8-11-10-24-7-38 13 13 18 29 17 48Z" fill="#d6ef91" />
      <path d="M45 166h230l23 20c3 3 1 8-4 8H26c-5 0-7-5-4-8l23-20Z" fill="#82928d" />
      <path d="M105 169h110l10 13H95z" fill="#aebbb4" opacity=".75" />
      <path d="M146 185h28" stroke="#526760" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Header({ cartCount, onOpenCart }) {
  return (
    <header className="site-header">
      <div className="wrap nav">
        <a className="brand" href="#top" aria-label="Renovatech Solutions home">
          <img src={logo} alt="Renovatech Solutions" />
        </a>
        <nav aria-label="Main navigation">
          <a href="#catalogue">Shop laptops</a>
          <a href="#why-renovatech">Why refurbished</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="header-actions">
          <button className="header-cart" type="button" onClick={onOpenCart} aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>
            <Icon name="cart" /><span className="header-cart-label">Cart</span><span className="cart-count" aria-live="polite">{cartCount}</span>
          </button>
          <a className="header-cta" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" /> <span>Chat with us</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({ totalUnits, modelCount, startingPrice }) {
  return (
    <section className="hero" id="top">
      <div className="hero-orb hero-orb--one" aria-hidden="true" />
      <div className="hero-orb hero-orb--two" aria-hidden="true" />
      <div className="wrap hero-layout">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Renovatech laptop store</div>
          <h1>Good laptops deserve <span>a second life.</span></h1>
          <p>Explore refurbished laptops in current stock. Compare configurations, check availability, and ask our team about the right fit.</p>
          <div className="hero-actions">
            <a className="button button--dark" href="#catalogue">Browse the catalogue <Icon name="arrow" /></a>
            <a className="text-link" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">Talk to a person <span>↗</span></a>
          </div>
          <div className="hero-proof">
            <div><strong>{modelCount}</strong><span>laptop models</span></div>
            <div><strong>{totalUnits}</strong><span>units in stock</span></div>
            <div><strong>{formatPrice.format(startingPrice)}</strong><span>starting price</span></div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-card hero-art-card--back"><span>REUSE MORE</span><b>♻</b></div>
          <div className="hero-art-card hero-art-card--front">
            <div className="hero-art-label"><span>REFURBISHED</span><span>01 / {String(modelCount).padStart(2, '0')}</span></div>
            <LaptopIllustration product={{ id: 'hero', model: 'Renovatech laptop' }} index={0} />
            <div className="hero-art-caption"><strong>Ready for a new chapter</strong><span>Thoughtful tech. Fresh start.</span></div>
          </div>
          <div className="hero-stamp"><span>LESS WASTE</span><b>MORE<br />POSSIBILITY</b></div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index, cartQuantity, onAddToCart }) {
  const available = product.quantity > 0;
  const atStockLimit = cartQuantity >= product.quantity;
  const enquiryMessage = `Hi Renovatech, I’d like to enquire about the ${product.model} (${product.configuration}) listed at ${formatPrice.format(product.price)}. Could you confirm availability and details?`;
  const enquiryLink = `https://wa.me/${phone}?text=${encodeURIComponent(enquiryMessage)}`;

  return (
    <article className="product-card">
      <div className={`product-art product-art--${index % 4}`}>
        <div className="product-art-top"><span>RENOVATECH · REUSE</span><span>{String(index + 1).padStart(2, '0')}</span></div>
        {product.imageUrl ? <img className="product-photo" src={product.imageUrl} alt={`${product.model} laptop`} /> : <LaptopIllustration product={product} index={index} />}
        <span className={`stock-label${available ? '' : ' stock-label--out'}`}>
          <span className="stock-dot" /> {available ? 'In stock' : 'Out of stock'}
        </span>
      </div>
      <div className="product-info">
        <div className="product-brand-row"><span className="product-brand">{product.brand}</span><span>Refurbished laptop</span></div>
        <h3>{product.model}</h3>
        <p className="product-processor">{[product.processor, product.generation].filter(Boolean).join(' · ') || product.configuration}</p>
        <div className="spec-list">
          {product.ramGb && <span><b>{product.ramGb} GB</b><small>Memory</small></span>}
          {product.storageGb && <span><b>{product.storageGb} GB</b><small>Storage</small></span>}
          {product.graphicsGb && <span><b>{product.graphicsGb} GB</b><small>Graphics</small></span>}
        </div>
        <div className="product-buy-row">
          <div><span className="price-label">Price</span><strong className="price">{formatPrice.format(product.price)}</strong></div>
          <span className="quantity-label">{product.quantity} {product.quantity === 1 ? 'unit' : 'units'} available</span>
        </div>
        <div className="product-actions">
          <a className="product-enquire" href={enquiryLink} target="_blank" rel="noreferrer"><Icon name="whatsapp" /> <span>Enquire on WhatsApp</span></a>
          <button className="product-cta" type="button" onClick={() => onAddToCart(product)} disabled={!available || atStockLimit}>
            <span>{!available ? 'Out of stock' : atStockLimit ? 'Stock limit reached' : 'Add to cart'}</span> <Icon name={available ? 'plus' : 'close'} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Catalogue({ inventory, cartQuantities, onAddToCart }) {
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('All');
  const [generation, setGeneration] = useState('All');
  const [sort, setSort] = useState('featured');
  const brands = useMemo(() => ['All', ...new Set(inventory.map((product) => product.brand))], [inventory]);
  const generations = useMemo(
    () => [...new Set(inventory.map((product) => product.generation).filter(Boolean))]
      .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10)),
    [inventory]
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const products = inventory.filter((product) => {
      const matchesText = !term || `${product.model} ${product.brand} ${product.configuration}`.toLowerCase().includes(term);
      const matchesBrand = brand === 'All' || product.brand === brand;
      const matchesGeneration = generation === 'All' || product.generation === generation;
      return matchesText && matchesBrand && matchesGeneration;
    });

    if (sort === 'price-low') products.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') products.sort((a, b) => b.price - a.price);
    if (sort === 'stock') products.sort((a, b) => b.quantity - a.quantity);
    return products;
  }, [inventory, search, brand, generation, sort]);

  return (
    <section className="catalogue-section" id="catalogue">
      <div className="wrap">
        <div className="catalogue-heading">
          <div>
            <div className="eyebrow">The current collection</div>
            <h2>Find your next laptop.</h2>
            <p>Browse the models and configurations currently listed by Renovatech.</p>
          </div>
          <span className="catalogue-count"><strong>{filtered.length}</strong> of {inventory.length} models</span>
        </div>

        <div className="catalogue-toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search model or configuration" aria-label="Search laptops" />
          </label>
          <div className="brand-filters" aria-label="Filter by brand">
            {brands.map((item) => (
              <button key={item} className={`filter-chip${brand === item ? ' is-active' : ''}`} onClick={() => setBrand(item)} aria-pressed={brand === item}>
                {item === 'All' ? 'All brands' : item}
              </button>
            ))}
          </div>
          <label className="select-box"><span>Generation</span>
            <select value={generation} onChange={(event) => setGeneration(event.target.value)} aria-label="Filter by processor generation">
              <option value="All">All generations</option>
              {generations.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="select-box"><span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort laptops">
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="stock">Availability</option>
            </select>
          </label>
        </div>

        {filtered.length > 0 ? (
          <div className="product-grid">
            {filtered.map((product, index) => <ProductCard key={product.id} product={product} index={index} cartQuantity={cartQuantities[product.id] || 0} onAddToCart={onAddToCart} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon">⌕</span>
            <h3>{inventory.length ? 'No laptops match those filters.' : 'No laptops are listed right now.'}</h3>
            <p>{inventory.length ? 'Try another model, brand, or processor generation.' : 'Please check back soon or contact our team.'}</p>
            {inventory.length > 0 && <button className="button button--dark" onClick={() => { setSearch(''); setBrand('All'); setGeneration('All'); }}>Clear filters</button>}
          </div>
        )}

        <p className="catalogue-note">Prices are shown in Indian rupees. Stock and pricing reflect the latest published inventory.</p>
      </div>
    </section>
  );
}

function CartDrawer({ cartItems, cartCount, onClose, onIncrease, onDecrease, onRemove }) {
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function handleSubmitOrder(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const customer = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim()
    };
    const orderId = createOrderId();
    const orderMessage = [
      'Hello Renovatech, I would like to place an order:',
      `Order reference: ${orderId}`,
      '',
      'Customer details:',
      `Name: ${customer.name}`,
      `Email: ${customer.email}`,
      `Phone: ${customer.phone}`,
      '',
      'Items:',
      ...cartItems.map(({ product, quantity }) => `• ${product.model} (${product.configuration}), ${quantity} × ${formatPrice.format(product.price)} = ${formatPrice.format(product.price * quantity)}`),
      `Order total: ${formatPrice.format(total)}`,
      '',
      'Please confirm this order. Payment and delivery will be arranged separately with your team.'
    ].join('\n');
    const whatsappOrderLink = `https://wa.me/${phone}?text=${encodeURIComponent(orderMessage)}`;
    window.open(whatsappOrderLink, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="cart-backdrop" onClick={onClose}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={(event) => event.stopPropagation()}>
        <div className="cart-drawer-header">
          <div><span className="eyebrow">Your selection</span><h2 id="cart-title">Shopping cart <span>({cartCount})</span></h2></div>
          <button className="cart-close" type="button" onClick={onClose} aria-label="Close cart"><Icon name="close" /></button>
        </div>

        {cartItems.length > 0 ? showCustomerForm ? (
          <div className="checkout-flow">
            <button className="checkout-back" type="button" onClick={() => setShowCustomerForm(false)}>← Back to cart</button>
            <div className="checkout-flow-heading">
              <span className="eyebrow">Almost there</span>
              <h3>Your contact details</h3>
              <p>We’ll include these details with your order message so our team can confirm it with you.</p>
            </div>
            <div className="checkout-flow-total"><span>Order total</span><strong>{formatPrice.format(total)}</strong></div>
            <form className="checkout-form" onSubmit={handleSubmitOrder}>
              <label className="checkout-field"><span>Full name</span><input name="name" type="text" autoComplete="name" maxLength="100" required /></label>
              <label className="checkout-field"><span>Email address</span><input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
              <label className="checkout-field"><span>Phone number</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength="30" required /></label>
              <div className="checkout-data-note">
                <p>Your name, email address, phone number, order details, and transaction ID will be shared with Renovatech via WhatsApp.</p>
                <p>A unique transaction ID will be generated and available in your WhatsApp conversation with our business account, allowing you to track and reference your order.</p>
                <p>After you send your order, our team will contact you to confirm it and provide:</p>
                <ul>
                  <li>Order confirmation</li>
                  <li>Available delivery options and timelines</li>
                  <li>Additional information required for delivery</li>
                  <li>Available payment methods</li>
                </ul>
                <p>We appreciate your trust in Renovatech Solution and look forward to serving you!</p>
                <p className="checkout-data-action">When you select <strong>Place order</strong>, WhatsApp will open with the message ready. Review it and tap Send to submit your order.</p>
              </div>
              <button className="button button--dark" type="submit">Place order</button>
            </form>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(({ product, quantity }) => (
                <article className="cart-item" key={product.id}>
                  <div className="cart-item-main">
                    <div className="cart-item-name"><strong>{product.model}</strong><span>{product.configuration}</span></div>
                    <strong className="cart-line-total">{formatPrice.format(product.price * quantity)}</strong>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-control" aria-label={`Quantity for ${product.model}`}>
                      <button type="button" onClick={() => onDecrease(product.id)} aria-label={`Decrease ${product.model} quantity`}>−</button>
                      <span aria-live="polite">{quantity}</span>
                      <button type="button" onClick={() => onIncrease(product)} disabled={quantity >= product.quantity} aria-label={`Increase ${product.model} quantity`}>+</button>
                    </div>
                    <span className="cart-unit-price">{formatPrice.format(product.price)} each</span>
                    <button className="cart-remove" type="button" onClick={() => onRemove(product.id)}><Icon name="trash" /> Remove</button>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-summary">
              <div className="cart-total-row"><span>Grand total</span><strong>{formatPrice.format(total)}</strong></div>
              <div className="checkout-reassurance"><p>No payment or delivery details are collected here. Our team will confirm availability over WhatsApp and arrange the delivery and payment process.</p></div>
              <button className="button button--dark cart-order-button" type="button" onClick={() => setShowCustomerForm(true)}>Place order</button>
            </div>
          </>
        ) : (
          <div className="cart-empty">
            <Icon name="cart" />
            <h3>Your cart is empty</h3>
            <p>Add laptops from the catalogue to start an order.</p>
            <button className="button button--dark" type="button" onClick={onClose}>Continue browsing</button>
          </div>
        )}
      </aside>
    </div>
  );
}

function About() {
  return (
    <section className="about-section" id="why-renovatech">
      <div className="wrap about-layout">
        <div className="about-mark" aria-hidden="true"><span>♻</span><small>GOOD TECH<br />GETS ANOTHER LIFE</small></div>
        <div className="about-copy">
          <div className="eyebrow">A more thoughtful way to buy</div>
          <h2>Quality tech can have more than one chapter.</h2>
          <p>Renovatech brings refurbished laptops back into use. Browse the available stock, compare what matters to you, and contact us to confirm the details before you buy.</p>
          <a className="text-link text-link--green" href="#catalogue">Explore the current stock <span>→</span></a>
        </div>
        <div className="about-points">
          <div><span>01</span><div><strong>Browse real stock</strong><p>Models, configurations, prices, and quantities come from the current inventory list.</p></div></div>
          <div><span>02</span><div><strong>Ask before you decide</strong><p>Send an enquiry directly to the Renovatech team about a specific laptop.</p></div></div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="wrap">
        <div className="contact-panel">
          <div className="contact-copy">
            <div className="eyebrow">Need a hand choosing?</div>
            <h2>Let’s find the right fit.</h2>
            <p>Tell us how you plan to use your laptop and we’ll help you review the options in stock.</p>
          </div>
          <a className="button button--light" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" /> Message Renovatech</a>
          <div className="contact-details">
            <a href="mailto:Renovatechsolution12@gmail.com"><Icon name="email" /> Renovatechsolution12@gmail.com</a>
            <a href={`tel:+${phone}`}><Icon name="phone" /> 9739224269</a>
            <span>Naveen S · Contact person</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [cart, setCart] = useState(readCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [inventory, setInventory] = useState(workbookInventory);
  const [catalogReady, setCatalogReady] = useState(!supabaseConfigured);

  useEffect(() => subscribeCatalog((products) => {
    setInventory(products);
    setCatalogReady(true);
  }), []);

  useEffect(() => {
    if (!catalogReady) return;
    setCart((current) => current.flatMap((item) => {
      const product = inventory.find((entry) => entry.id === item.id);
      const quantity = Math.min(product?.quantity || 0, item.quantity);
      return product && quantity > 0 ? [{ id: item.id, quantity }] : [];
    }));
  }, [catalogReady, inventory]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // The cart remains usable for this visit when browser storage is unavailable.
    }
  }, [cart]);

  useEffect(() => {
    if (!isCartOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen]);

  const cartQuantities = useMemo(() => Object.fromEntries(cart.map((item) => [item.id, item.quantity])), [cart]);
  const cartItems = cart.flatMap((item) => {
    const product = inventory.find((entry) => entry.id === item.id);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product) {
    setCart((current) => {
      const existingItem = current.find((item) => item.id === product.id);
      if (!existingItem) return product.quantity > 0 ? [...current, { id: product.id, quantity: 1 }] : current;
      if (existingItem.quantity >= product.quantity) return current;
      return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    });
    setIsCartOpen(true);
  }

  function increaseCartItem(product) {
    setCart((current) => current.map((item) => item.id === product.id && item.quantity < product.quantity
      ? { ...item, quantity: item.quantity + 1 }
      : item));
  }

  function decreaseCartItem(productId) {
    setCart((current) => current.flatMap((item) => {
      if (item.id !== productId) return [item];
      return item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [];
    }));
  }

  const totalUnits = inventory.reduce((total, product) => total + product.quantity, 0);
  const startingPrice = inventory.length ? Math.min(...inventory.map((product) => product.price)) : 0;

  return (
    <>
      <Header cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
      <main>
        <Hero totalUnits={totalUnits} modelCount={inventory.length} startingPrice={startingPrice} />
        <Catalogue inventory={inventory} cartQuantities={cartQuantities} onAddToCart={addToCart} />
        <About />
        <Contact />
      </main>
      <footer className="site-footer"><div className="wrap"><span>© {new Date().getFullYear()} Renovatech Solutions</span><span>Refurbished laptops, ready for their next chapter.</span></div></footer>
      {isCartOpen && <CartDrawer cartItems={cartItems} cartCount={cartCount} onClose={() => setIsCartOpen(false)} onIncrease={increaseCartItem} onDecrease={decreaseCartItem} onRemove={(productId) => setCart((current) => current.filter((item) => item.id !== productId))} />}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
