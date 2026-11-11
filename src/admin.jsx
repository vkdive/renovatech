import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../renovatech-logo.jpeg';
import inventory from './products.json';
import { toCatalogProduct, toSupabaseProduct } from './productData.js';
import { supabase, supabaseConfigured } from './supabase.js';
import { subscribeCatalog } from './supabase-catalog.js';
import './admin.css';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const emptyForm = { model: '', configuration: '', price: '', quantity: '' };

function errorText(error) {
  return error?.message || 'Something went wrong. Please try again.';
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function AdminApp() {
  const isLoginRoute = /\/admin\/login(?:\/|$)/.test(window.location.pathname);
  const adminBasePath = window.location.pathname.replace(/\/login\/?$/, '/').replace(/\/?$/, '/');
  const catalogueHref = new URL('../', `${window.location.origin}${adminBasePath}`).pathname;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [staffRole, setStaffRole] = useState('');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [existingImagePath, setExistingImagePath] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      setAuthInitialized(true);
      return undefined;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !authInitialized) return undefined;
    let active = true;

    if (!user) {
      setIsStaff(false);
      setStaffRole('');
      setCheckingSession(false);
      return () => { active = false; };
    }

    setCheckingSession(true);
    (async () => {
      try {
        const { data: access, error: accessError } = await supabase
          .from('staff_profiles')
          .select('role, active')
          .eq('user_id', user.id)
          .maybeSingle();

        if (accessError) throw accessError;
        if (!active) return;

        if (!access?.active || !['admin', 'staff'].includes(access.role)) {
          setIsStaff(false);
          setError('This account is not authorized for inventory access. Ask an administrator to grant access.');
          await supabase.auth.signOut();
          return;
        }

        setIsStaff(true);
        setStaffRole(access.role);
        setError('');
      } catch (accessError) {
        if (!active) return;
        setIsStaff(false);
        setError(`Could not verify staff access: ${errorText(accessError)}`);
        await supabase.auth.signOut();
      } finally {
        if (active) setCheckingSession(false);
      }
    })();

    return () => { active = false; };
  }, [authInitialized, user]);

  useEffect(() => {
    if (!supabaseConfigured || !authInitialized || checkingSession) return;
    if (isStaff && isLoginRoute) window.location.replace(adminBasePath);
    if (!isStaff && !isLoginRoute) window.location.replace(`${adminBasePath}login/`);
  }, [adminBasePath, authInitialized, checkingSession, isLoginRoute, isStaff]);

  useEffect(() => {
    if (!isStaff || !supabase) return undefined;
    return subscribeCatalog(setProducts, (catalogError) => setError(`Could not load products: ${errorText(catalogError)}`));
  }, [isStaff]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  async function signIn(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      setBusy(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      setPassword('');
      setNotice('Signed in. Verifying inventory access…');
    } catch (signInError) {
      setError(`Could not sign in: ${errorText(signInError)}`);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setError('');
    setNotice('');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setIsStaff(false);
      setStaffRole('');
      setNotice('You have signed out securely.');
    } catch (signOutError) {
      setError(`Could not end your session: ${errorText(signOutError)}`);
    }
  }

  async function importWorkbookProducts() {
    if (!supabase || !isStaff) return;
    try {
      setBusy(true);
      const rows = inventory.map((product) => toSupabaseProduct(toCatalogProduct(product.id, product)));
      for (let start = 0; start < rows.length; start += 500) {
        const { error: importError } = await supabase.from('products').upsert(rows.slice(start, start + 500), { onConflict: 'id' });
        if (importError) throw importError;
      }
      setNotice(`Imported ${inventory.length} products from the latest workbook build.`);
    } catch (importError) {
      setError(`Could not import the workbook catalogue: ${errorText(importError)}`);
    } finally {
      setBusy(false);
    }
  }

  function selectProduct(product) {
    setEditingId(product.id);
    setForm({ model: product.model, configuration: product.configuration, price: String(product.price), quantity: String(product.quantity) });
    setExistingImageUrl(product.imageUrl || '');
    setExistingImagePath(product.imagePath || '');
    setImageFile(null);
    setError('');
    setNotice(`Editing ${product.model}.`);
    document.querySelector('#product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetProductForm() {
    setForm(emptyForm);
    setEditingId('');
    setExistingImageUrl('');
    setExistingImagePath('');
    setImageFile(null);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    const model = form.model.trim();
    const configuration = form.configuration.trim();
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!model || !configuration || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 0) {
      setError('Enter a model, configuration, non-negative price, and whole-number stock quantity.');
      return;
    }
    if (imageFile && (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024)) {
      setError('Choose an image under 5 MB. Supported formats are JPEG, PNG, or WebP.');
      return;
    }

    const productId = editingId || `${slugify(model)}-${window.crypto?.randomUUID?.() || Date.now().toString(36)}`;
    let imageUrl = existingImageUrl;
    let imagePath = existingImagePath;
    let newlyUploadedPath = '';

    try {
      setBusy(true);
      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-z0-9._-]/gi, '-');
        const uploadPath = `${productId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(uploadPath, imageFile, {
          cacheControl: '3600',
          contentType: imageFile.type,
          upsert: false
        });
        if (uploadError) throw uploadError;
        newlyUploadedPath = uploadPath;
        imagePath = uploadPath;
        imageUrl = supabase.storage.from('product-images').getPublicUrl(uploadPath).data.publicUrl;
      }

      const product = toCatalogProduct(productId, { model, configuration, price, quantity, imageUrl, imagePath });
      const { error: saveError } = await supabase.from('products').upsert(toSupabaseProduct(product), { onConflict: 'id' });
      if (saveError) throw saveError;

      if (newlyUploadedPath && existingImagePath && existingImagePath !== newlyUploadedPath) {
        const { error: removeError } = await supabase.storage.from('product-images').remove([existingImagePath]);
        if (removeError) console.warn('Could not remove the replaced product image:', removeError.message);
      }
      setNotice(`${model} ${editingId ? 'updated' : 'added'} to the catalogue.`);
      resetProductForm();
    } catch (saveError) {
      if (newlyUploadedPath) await supabase.storage.from('product-images').remove([newlyUploadedPath]);
      setError(`Could not save this product: ${errorText(saveError)}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.model} from the live catalogue?`)) return;
    setError('');
    setNotice('');
    try {
      setBusy(true);
      const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);
      if (deleteError) throw deleteError;
      if (product.imagePath) {
        const { error: imageError } = await supabase.storage.from('product-images').remove([product.imagePath]);
        if (imageError) console.warn('Product was deleted, but its image could not be removed:', imageError.message);
      }
      if (editingId === product.id) resetProductForm();
      setNotice(`${product.model} was deleted from the catalogue.`);
    } catch (deleteError) {
      setError(`Could not delete this product: ${errorText(deleteError)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <a className="admin-brand" href={catalogueHref} aria-label="Renovatech catalogue">
          <img src={logo} alt="Renovatech Solutions" />
          <span>Inventory admin</span>
        </a>
        <div className="admin-topbar-actions">
          <a href={catalogueHref}>View catalogue</a>
          {isStaff && <button className="admin-button admin-button--quiet" type="button" onClick={logout}>Sign out</button>}
        </div>
      </header>

      <main className="admin-main">
        {!supabaseConfigured && (
          <section className="admin-card admin-setup-card">
            <span className="admin-kicker">Setup required</span>
            <h1>Connect the admin workspace</h1>
            <p>Add your Supabase project URL and publishable key to a local <code>.env</code> file and the GitHub Actions repository variables. The setup steps are in the README.</p>
          </section>
        )}

        {supabaseConfigured && checkingSession && (
          <section className="admin-card admin-login-card"><span className="admin-kicker">Secure inventory access</span><h1>Checking access</h1><p className="admin-loading">Verifying your Supabase session and staff permissions…</p></section>
        )}

        {supabaseConfigured && !checkingSession && !isStaff && (
          <section className="admin-card admin-login-card">
            <span className="admin-kicker">Secure inventory access</span>
            <h1>Admin and staff login</h1>
            <p>Sign in using the email address and password for an authorized account.</p>
            <form className="admin-form admin-login-form" onSubmit={signIn}>
              <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required /></label>
              <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
              <button className="admin-button admin-button--primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
          </section>
        )}

        {supabaseConfigured && isStaff && (
          <>
            <section className="admin-heading-row">
              <div><span className="admin-kicker">{staffRole} · {user?.email}</span><h1>Manage laptop stock</h1><p>Update catalogue details and upload product photos. Changes appear on the store as they are saved.</p></div>
              <span className="admin-live-badge"><span /> Live catalogue</span>
            </section>

            {products.length === 0 && (
              <section className="admin-card admin-import-card">
                <div><h2>Load the workbook inventory</h2><p>Start with the current {inventory.length} products generated from <code>stock_list.xlsx</code>. You can add photos and edit each product afterward.</p></div>
                <button className="admin-button admin-button--primary" type="button" onClick={importWorkbookProducts} disabled={busy}>{busy ? 'Importing…' : 'Import current catalogue'}</button>
              </section>
            )}

            <div className="admin-workspace">
              <section className="admin-card admin-product-editor" id="product-form">
                <div className="admin-section-heading"><div><span className="admin-kicker">Product details</span><h2>{editingId ? 'Edit product' : 'Add product'}</h2></div>{editingId && <button className="admin-text-button" type="button" onClick={resetProductForm}>Cancel edit</button>}</div>
                <form className="admin-form" onSubmit={saveProduct}>
                  <label>Model<input type="text" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} maxLength="100" placeholder="Dell 3410" required /></label>
                  <label>Configuration<input type="text" value={form.configuration} onChange={(event) => setForm({ ...form, configuration: event.target.value })} maxLength="160" placeholder="i5 10th 8/256" required /></label>
                  <p className="admin-field-hint">CPU generation, memory, and storage shown on the store are derived from this configuration.</p>
                  <div className="admin-field-grid">
                    <label>Price (INR)<input type="number" min="0" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="28000" required /></label>
                    <label>Quantity<input type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="2" required /></label>
                  </div>
                  <label>Product image <span className="admin-optional">optional</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} /></label>
                  <p className="admin-field-hint">JPEG, PNG, or WebP · Maximum 5 MB</p>
                  {(imagePreview || existingImageUrl) && <img className="admin-image-preview" src={imagePreview || existingImageUrl} alt="Product preview" />}
                  <button className="admin-button admin-button--primary" type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}</button>
                </form>
              </section>
            </div>

            <section className="admin-card admin-products-card">
              <div className="admin-section-heading"><div><span className="admin-kicker">Live inventory</span><h2>Products <span className="admin-list-count">{products.length}</span></h2></div></div>
              {products.length === 0 ? <p className="admin-empty">No products loaded yet. Import the current workbook catalogue to begin.</p> : (
                <div className="admin-product-list">
                  {products.map((product) => (
                    <article className="admin-product-row" key={product.id}>
                      <div className="admin-product-thumb">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>♻</span>}</div>
                      <div className="admin-product-copy"><strong>{product.model}</strong><span>{product.configuration}</span></div>
                      <div className="admin-product-price"><strong>{money.format(product.price)}</strong><span>{product.quantity} in stock</span></div>
                      <div className="admin-row-actions">
                        <button className="admin-button admin-button--secondary" type="button" onClick={() => selectProduct(product)}>Edit</button>
                        <button className="admin-button admin-button--danger" type="button" onClick={() => deleteProduct(product)} disabled={busy}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
        {notice && <div className="admin-alert admin-alert--notice" role="status">{notice}</div>}
      </main>
      <footer className="admin-footer">Renovatech Solutions · Admin workspace</footer>
    </div>
  );
}

createRoot(document.getElementById('admin-root')).render(<AdminApp />);
