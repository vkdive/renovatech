import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../renovatech-logo.jpeg';
import inventory from './products.json';
import './styles.css';

const phone = '919739224269';
const formatPrice = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

function Icon({ name, className = '' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    whatsapp: <><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.1Z" /><path d="M8.5 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .6.5.9 1.3 1.6 2.2 2 .2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.3.4.5 0 .3-.2 1.1-.7 1.5-.5.5-1.1.7-1.8.6-1.1-.2-2.4-.8-3.6-1.9-1.4-1.2-2.3-2.7-2.6-3.7-.3-.9 0-1.7.4-2.2Z" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.7a15 15 0 0 0 4.8 4.8L15 13l5 2v4a2 2 0 0 1-2.2 2A18 18 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
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

function Header() {
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
        <a className="header-cta" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
          <Icon name="whatsapp" /> <span>Chat with us</span>
        </a>
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

function ProductCard({ product, index }) {
  const available = product.quantity > 0;
  const message = `Hi Renovatech, I’m interested in the ${product.model} (${product.configuration}) listed at ${formatPrice.format(product.price)}. Could you confirm availability and details?`;
  const inquiryLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <article className="product-card">
      <div className={`product-art product-art--${index % 4}`}>
        <div className="product-art-top"><span>RENOVATECH · REUSE</span><span>{String(index + 1).padStart(2, '0')}</span></div>
        <LaptopIllustration product={product} index={index} />
        <span className={`stock-label${available ? '' : ' stock-label--out'}`}>
          <span className="stock-dot" /> {available ? 'In stock' : 'Currently unavailable'}
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
        <a className="product-cta" href={inquiryLink} target="_blank" rel="noreferrer">
          {available ? 'Enquire on WhatsApp' : 'Ask about availability'} <Icon name="arrow" />
        </a>
      </div>
    </article>
  );
}

function Catalogue() {
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('All');
  const [generation, setGeneration] = useState('All');
  const [sort, setSort] = useState('featured');
  const brands = useMemo(() => ['All', ...new Set(inventory.map((product) => product.brand))], []);
  const generations = useMemo(
    () => [...new Set(inventory.map((product) => product.generation).filter(Boolean))]
      .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10)),
    []
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
  }, [search, brand, generation, sort]);

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
            {filtered.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon">⌕</span>
            <h3>No laptops match those filters.</h3>
            <p>Try another model, brand, or processor generation.</p>
            <button className="button button--dark" onClick={() => { setSearch(''); setBrand('All'); setGeneration('All'); }}>Clear filters</button>
          </div>
        )}

        <p className="catalogue-note">Prices are shown in Indian rupees. Stock and pricing reflect the latest published inventory.</p>
      </div>
    </section>
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
  const totalUnits = inventory.reduce((total, product) => total + product.quantity, 0);
  const startingPrice = Math.min(...inventory.map((product) => product.price));

  return (
    <>
      <Header />
      <main>
        <Hero totalUnits={totalUnits} modelCount={inventory.length} startingPrice={startingPrice} />
        <Catalogue />
        <About />
        <Contact />
      </main>
      <footer className="site-footer"><div className="wrap"><span>© {new Date().getFullYear()} Renovatech Solutions</span><span>Refurbished laptops, ready for their next chapter.</span></div></footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
