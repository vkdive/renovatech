import savedCatalogueData from './products.json';
import { fromSupabaseProduct, isImportableProduct, toCatalogProduct } from './productData.js';
import { supabase } from './supabase.js';

const inventory = savedCatalogueData
  .filter(isImportableProduct)
  .map((product) => toCatalogProduct(product.id, product));

export function subscribeCatalog(onUpdate, onError) {
  if (!supabase) {
    onUpdate(inventory);
    return () => {};
  }

  let stopped = false;
  let hasLoaded = false;
  const loadProducts = async () => {
    const [productsResult, imagesResult] = await Promise.all([
      supabase.from('products').select('*').order('brand').order('model_number'),
      supabase.from('product_images').select('*').order('position').order('created_at')
    ]);
    if (stopped) return;
    if (productsResult.error) {
      onError?.(productsResult.error);
      if (!hasLoaded) onUpdate(inventory);
      return;
    }

    if (imagesResult.error) onError?.(`Could not load product photos: ${imagesResult.error.message}`);
    const imagesByProduct = new Map();
    for (const image of imagesResult.data || []) {
      const productImages = imagesByProduct.get(image.product_id) || [];
      productImages.push(image);
      imagesByProduct.set(image.product_id, productImages);
    }

    hasLoaded = true;
    onUpdate((productsResult.data || []).map((product) => fromSupabaseProduct(
      imagesResult.error
        ? product
        : { ...product, product_images: imagesByProduct.get(product.id) || [] }
    )));
  };

  loadProducts();
  const channel = supabase
    .channel('public-products-catalogue')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, loadProducts)
    .subscribe();

  return () => {
    stopped = true;
    supabase.removeChannel(channel);
  };
}
