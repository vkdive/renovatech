import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../renovatech-logo.jpeg';
import savedCatalogueData from './products.json';
import { isImportableProduct, toCatalogProduct, toSupabaseProduct } from './productData.js';
import { supabase, supabaseConfigured } from './supabase.js';
import { subscribeCatalog } from './supabase-catalog.js';
import './admin.css';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const savedInventory = savedCatalogueData.filter(isImportableProduct);
const emptyForm = {
  brand: '',
  modelNumber: '',
  processor: '',
  memory: '',
  storage: '',
  gpu: '',
  display: '',
  operatingSystem: '',
  price: '',
  quantity: ''
};

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

  async function importSavedCatalogue() {
    if (!supabase || !isStaff) return;
    try {
      setBusy(true);
      const rows = savedInventory.map((product) => toSupabaseProduct(toCatalogProduct(product.id, product)));
      for (let start = 0; start < rows.length; start += 500) {
        const { error: importError } = await supabase.from('products').upsert(rows.slice(start, start + 500), { onConflict: 'id' });
        if (importError) throw importError;
      }
      setNotice(`Imported ${savedInventory.length} products from the saved catalogue.`);
    } catch (importError) {
      setError(`Could not import the saved catalogue: ${errorText(importError)}`);
    } finally {
      setBusy(false);
    }
  }

  function selectProduct(product) {
    setEditingId(product.id);
    setForm({
      brand: product.brand || '',
      modelNumber: product.modelNumber || product.model || '',
      processor: [product.processor, product.generation].filter(Boolean).join(' · '),
      memory: product.memory || '',
      storage: product.storage || '',
      gpu: product.gpu || '',
      display: product.display || '',
      operatingSystem: product.operatingSystem || '',
      price: String(product.price),
      quantity: String(product.quantity)
    });
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
    const brand = form.brand.trim();
    const modelNumber = form.modelNumber.trim();
    const model = [brand, modelNumber].filter(Boolean).join(' ');
    const processor = form.processor.trim();
    const memory = form.memory.trim();
    const storage = form.storage.trim();
    const gpu = form.gpu.trim();
    const display = form.display.trim();
    const operatingSystem = form.operatingSystem.trim();
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!brand || !modelNumber || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 0) {
      setError('Enter a brand, exact model number, non-negative price, and whole-number stock quantity.');
      return;
    }
    if (imageFile && (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024)) {
      setError('Choose an image under 5 MB. Supported formats are JPEG, PNG, or WebP.');
      return;
    }

    const productId = editingId || `${slugify(`${brand}-${modelNumber}`)}-${window.crypto?.randomUUID?.() || Date.now().toString(36)}`;
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

      const product = toCatalogProduct(productId, {
        model,
        modelNumber,
        brand,
        processor,
        memory,
        storage,
        gpu,
        display,
        operatingSystem,
        price,
        quantity,
        imageUrl,
        imagePath
      });
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
                <div><h2>{savedInventory.length ? 'Load the saved catalogue' : 'No saved products available'}</h2><p>{savedInventory.length ? <>Start with the {savedInventory.length} valid products saved in <code>src/products.json</code>. You can add photos and edit each product afterward.</> : <>Add products with the form below, or add valid product records to <code>src/products.json</code> before importing.</>}</p></div>
                {savedInventory.length > 0 && <button className="admin-button admin-button--primary" type="button" onClick={importSavedCatalogue} disabled={busy}>{busy ? 'Importing…' : 'Import saved catalogue'}</button>}
              </section>
            )}

            <div className="admin-workspace">
              <section className="admin-card admin-product-editor" id="product-form">
                <div className="admin-section-heading"><div><span className="admin-kicker">Product details</span><h2>{editingId ? 'Edit product' : 'Add product'}</h2></div>{editingId && <button className="admin-text-button" type="button" onClick={resetProductForm}>Cancel edit</button>}</div>
                <form className="admin-form" onSubmit={saveProduct}>
                  <div className="admin-field-grid">
                    <label>Brand<input type="text" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} maxLength="60" placeholder="Dell" required /></label>
                    <label>Exact model number<input type="text" value={form.modelNumber} onChange={(event) => setForm({ ...form, modelNumber: event.target.value })} maxLength="100" placeholder="Latitude 3420" required /></label>
                  </div>
                  <div className="admin-field-grid">
                    <label>Processor (CPU)<input type="text" value={form.processor} onChange={(event) => setForm({ ...form, processor: event.target.value })} maxLength="120" placeholder="Intel Core i5-1135G7" /></label>
                    <label>Memory (RAM)<input type="text" value={form.memory} onChange={(event) => setForm({ ...form, memory: event.target.value })} maxLength="80" placeholder="8 GB DDR4" /></label>
                  </div>
                  <div className="admin-field-grid">
                    <label>Storage<input type="text" value={form.storage} onChange={(event) => setForm({ ...form, storage: event.target.value })} maxLength="100" placeholder="256 GB SSD" /></label>
                    <label>Graphics Card (GPU)<input type="text" value={form.gpu} onChange={(event) => setForm({ ...form, gpu: event.target.value })} maxLength="120" placeholder="Intel Iris Xe Graphics" /></label>
                  </div>
                  <div className="admin-field-grid">
                    <label>Display<input type="text" value={form.display} onChange={(event) => setForm({ ...form, display: event.target.value })} maxLength="100" placeholder="14-inch FHD IPS" /></label>
                    <label>Operating System (OS)<input type="text" value={form.operatingSystem} onChange={(event) => setForm({ ...form, operatingSystem: event.target.value })} maxLength="100" placeholder="Windows 11 Pro" /></label>
                  </div>
                  <p className="admin-field-hint">Older specifications have been carried over where available. Complete or correct any missing fields before saving.</p>
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
              {products.length === 0 ? <p className="admin-empty">No products loaded yet. Import the saved catalogue to begin.</p> : (
                <div className="admin-product-list">
                  {products.map((product) => (
                    <article className="admin-product-row" key={product.id}>
                      <div className="admin-product-thumb">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>♻</span>}</div>
                      <div className="admin-product-copy"><strong>{product.brand} {product.modelNumber || product.model}</strong><span>{[product.processor, product.memory, product.storage, product.gpu, product.display, product.operatingSystem].filter(Boolean).join(' · ') || product.configuration}</span></div>
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
