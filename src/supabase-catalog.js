import inventory from './products.json';
import { fromSupabaseProduct } from './productData.js';
import { supabase } from './supabase.js';

export function subscribeCatalog(onUpdate, onError) {
  if (!supabase) {
    onUpdate(inventory);
    return () => {};
  }

  let stopped = false;
  let hasLoaded = false;
  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('brand')
      .order('model_number');
    if (stopped) return;
    if (error) {
      onError?.(error);
      if (!hasLoaded) onUpdate(inventory);
      return;
    }
    hasLoaded = true;
    onUpdate((data || []).map(fromSupabaseProduct));
  };

  loadProducts();
  const channel = supabase
    .channel('public-products-catalogue')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts)
    .subscribe();

  return () => {
    stopped = true;
    supabase.removeChannel(channel);
  };
}
