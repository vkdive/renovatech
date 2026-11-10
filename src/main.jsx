import React from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../renovatech-logo.jpeg';
import './styles.css';

const offerings = [
  {
    icon: '💻',
    title: 'Refurbished laptops',
    description: 'Find a pre-owned laptop for work, study, or everyday use. Ask us about current availability, specifications, and pricing.'
  },
  {
    icon: '🧩',
    title: 'Computer hardware solutions',
    description: 'Discuss your requirements with us and find the right computer hardware for your needs.'
  }
];

const steps = [
  {
    title: 'Share your requirements',
    description: 'Tell us what you need your laptop or computer hardware to do.'
  },
  {
    title: 'Discuss suitable options',
    description: 'We’ll talk through available laptops or hardware options that fit your request.'
  },
  {
    title: 'Choose your next step',
    description: 'Get the details you need to move forward with confidence.'
  }
];

function ContactIcon({ name }) {
  const drawings = {
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.7a15 15 0 0 0 4.8 4.8L15 13l5 2v4a2 2 0 0 1-2.2 2A18 18 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />,
    whatsapp: <><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.1Z" /><path d="M8.5 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .6.5.9 1.3 1.6 2.2 2 .2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.3.4.5 0 .3-.2 1.1-.7 1.5-.5.5-1.1.7-1.8.6-1.1-.2-2.4-.8-3.6-1.9-1.4-1.2-2.3-2.7-2.6-3.7-.3-.9 0-1.7.4-2.2Z" /></>
  };

  return (
    <span className="contact-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">{drawings[name]}</svg>
    </span>
  );
}

function ContactItem({ icon, label, href, children, whatsapp = false }) {
  return (
    <div className={`contact-detail${whatsapp ? ' contact-detail--whatsapp' : ''}`}>
      <ContactIcon name={icon} />
      <div>
        <span className="contact-label">{label}</span>
        {href
          ? <a className="contact-value" href={href}>{children}</a>
          : <span className="contact-value">{children}</span>}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="wrap nav">
        <a className="brand" href="#top" aria-label="Renovatech Solutions home">
          <img src={logo} alt="Renovatech Solutions — Refurbished Laptops & Computer Hardware" />
        </a>
        <nav aria-label="Main navigation">
          <a href="#offerings">What we offer</a>
          <a href="#approach">How it works</a>
          <a className="button nav-button" href="#contact">Get in touch</a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-layout">
        <div className="hero-inner">
          <div className="eyebrow">Refurbished laptops &amp; hardware solutions</div>
          <h1>Good technology, <span>renewed for you.</span></h1>
          <p>Renovatech Solutions sells refurbished laptops and provides computer hardware solutions shaped around your needs.</p>
          <div className="actions">
            <a className="button" href="#offerings">Explore what we offer</a>
            <a className="button secondary" href="#contact">Tell us what you need</a>
          </div>
          <div className="hero-note">
            <span>Refurbished laptops</span>
            <span>Hardware solutions for your needs</span>
          </div>
        </div>
        <aside className="hero-panel" aria-label="Renovatech services">
          <div className="panel-icon" aria-hidden="true">♻️</div>
          <p className="panel-label">Technology, thoughtfully renewed</p>
          <div className="panel-item"><span>01</span><strong>Refurbished laptops</strong></div>
          <div className="panel-item"><span>02</span><strong>Computer hardware solutions</strong></div>
        </aside>
      </div>
    </section>
  );
}

function Offerings() {
  return (
    <section id="offerings" className="offerings">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">What we offer</div>
          <h2>Laptops and computer hardware for your needs</h2>
          <p className="lead">Choose a refurbished laptop or talk with us about computer hardware for your needs.</p>
        </div>
        <div className="cards">
          {offerings.map((offering) => (
            <article className="card" key={offering.title}>
              <div className="card-icon" aria-hidden="true">{offering.icon}</div>
              <h3>{offering.title}</h3>
              <p>{offering.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Approach() {
  return (
    <section id="approach" className="how">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">A personal approach</div>
          <h2>Start with what you need</h2>
          <p className="lead">We keep the conversation focused on finding the right laptop or computer hardware for you.</p>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div className="step" key={step.title}>
              <div className="step-number">{index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact">
      <div className="wrap">
        <div className="contact">
          <div className="eyebrow">Get in touch</div>
          <h2>Looking for a laptop or hardware solution?</h2>
          <p>Contact Renovatech Solutions to ask about refurbished laptop availability or discuss computer hardware options for your needs.</p>
          <div className="contact-details" aria-label="Contact information">
            <ContactItem icon="email" label="Email address" href="mailto:naveensnave@gmail.com">naveensnave@gmail.com</ContactItem>
            <ContactItem icon="person" label="Contact person">Naveen S</ContactItem>
            <ContactItem icon="phone" label="Contact number" href="tel:+919739224269">9739224269</ContactItem>
            <ContactItem icon="whatsapp" label="WhatsApp" href="https://wa.me/919739224269" whatsapp>9739224269</ContactItem>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <Offerings />
        <Approach />
        <Contact />
      </main>
      <footer><div className="wrap">© {new Date().getFullYear()} Renovatech Solutions</div></footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
