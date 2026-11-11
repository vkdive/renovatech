function getBrand(model) {
  const brand = model.match(/^[a-z]+/i)?.[0] ?? 'Other';
  return brand.toLowerCase() === 'hp' ? 'HP' : brand[0].toUpperCase() + brand.slice(1).toLowerCase();
}

function ordinal(value) {
  const suffix = value % 10 === 1 && value % 100 !== 11 ? 'st'
    : value % 10 === 2 && value % 100 !== 12 ? 'nd'
      : value % 10 === 3 && value % 100 !== 13 ? 'rd'
        : 'th';
  return `${value}${suffix}`;
}

export function toCatalogProduct(id, source) {
  const model = String(source.model ?? '').trim();
  const configuration = String(source.configuration ?? '').trim();
  const processorMatch = configuration.match(/\b(i[3579])\s+(\d+)(?:st|nd|rd|th)\b/i);
  const memoryStorageMatch = configuration.match(/(\d+)\s*\/\s*(\d+)/);
  const graphicsMatch = configuration.match(/(\d+)\s*gb?\s+graphics/i);

  return {
    id: String(source.id || id),
    model,
    brand: source.brand || getBrand(model),
    configuration,
    processor: source.processor ?? (processorMatch ? `Core ${processorMatch[1].toLowerCase()}` : null),
    generation: source.generation ?? (processorMatch ? `${ordinal(Number(processorMatch[2]))} Gen` : null),
    ramGb: source.ramGb ?? (memoryStorageMatch ? Number(memoryStorageMatch[1]) : null),
    storageGb: source.storageGb ?? (memoryStorageMatch ? Number(memoryStorageMatch[2]) : null),
    graphicsGb: source.graphicsGb ?? (graphicsMatch ? Number(graphicsMatch[1]) : null),
    price: Number(source.price) || 0,
    quantity: Math.max(0, Math.floor(Number(source.quantity) || 0)),
    imageUrl: String(source.imageUrl || ''),
    imagePath: String(source.imagePath || '')
  };
}

export function fromSupabaseProduct(row) {
  return toCatalogProduct(row.id, {
    ...row,
    ramGb: row.ram_gb,
    storageGb: row.storage_gb,
    graphicsGb: row.graphics_gb,
    imageUrl: row.image_url,
    imagePath: row.image_path
  });
}

export function toSupabaseProduct(product) {
  return {
    id: product.id,
    model: product.model,
    brand: product.brand,
    configuration: product.configuration,
    processor: product.processor,
    generation: product.generation,
    ram_gb: product.ramGb,
    storage_gb: product.storageGb,
    graphics_gb: product.graphicsGb,
    price: product.price,
    quantity: product.quantity,
    image_url: product.imageUrl || null,
    image_path: product.imagePath || null
  };
}
