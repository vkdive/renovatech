function getBrand(model) {
  const brand = model.match(/^[^\s]+/)?.[0] ?? 'Other';
  return brand.toLowerCase() === 'hp' ? 'HP' : brand[0].toUpperCase() + brand.slice(1).toLowerCase();
}

function ordinal(value) {
  const suffix = value % 10 === 1 && value % 100 !== 11 ? 'st'
    : value % 10 === 2 && value % 100 !== 12 ? 'nd'
      : value % 10 === 3 && value % 100 !== 13 ? 'rd'
        : 'th';
  return `${value}${suffix}`;
}

function inferGeneration(configuration, processor) {
  const processorMatch = processor.match(/(\d+(?:st|nd|rd|th)\s+Gen)\s*$/i);
  if (processorMatch) return processorMatch[1];
  const configurationMatch = configuration.match(/\b(?:i[3579])\s+(\d+)(?:st|nd|rd|th)\b/i);
  return configurationMatch ? `${ordinal(Number(configurationMatch[1]))} Gen` : '';
}

function stripGeneration(processor) {
  return processor.replace(/\s*[·,-]?\s*\d+(?:st|nd|rd|th)\s+Gen\s*$/i, '').trim();
}

export function isImportableProduct(product) {
  return Boolean(
    product &&
    typeof product === 'object' &&
    String(product.id ?? '').trim() &&
    String(product.modelNumber || product.model_number || product.model || '').trim() &&
    product.price !== null && product.price !== undefined && Number.isFinite(Number(product.price)) &&
    product.quantity !== null && product.quantity !== undefined && Number.isFinite(Number(product.quantity))
  );
}

export function toCatalogProduct(id, source) {
  const legacyModel = String(source.model ?? '').trim();
  const brand = String(source.brand || source.brand_name || getBrand(legacyModel)).trim() || 'Other';
  const inferredModelNumber = legacyModel.toLowerCase().startsWith(`${brand.toLowerCase()} `)
    ? legacyModel.slice(brand.length).trim()
    : legacyModel;
  const modelNumber = String(source.modelNumber || source.model_number || inferredModelNumber).trim();
  const legacyConfiguration = String(source.configuration ?? '').trim();
  const processorSource = String(source.processor || source.cpu || '').trim();
  const generation = String(source.generation || inferGeneration(legacyConfiguration, processorSource)).trim();
  const processorMatch = legacyConfiguration.match(/\b(i[3579])\s+\d+(?:st|nd|rd|th)\b/i);
  const inferredProcessor = processorMatch ? `Core ${processorMatch[1].toLowerCase()}` : '';
  const processor = stripGeneration(processorSource || inferredProcessor);
  const memoryStorageMatch = legacyConfiguration.match(/(\d+)\s*\/\s*(\d+)/);
  const graphicsMatch = legacyConfiguration.match(/(\d+)\s*gb?\s+graphics/i);
  const ramGb = source.ramGb ?? source.ram_gb ?? (memoryStorageMatch ? Number(memoryStorageMatch[1]) : null);
  const storageGb = source.storageGb ?? source.storage_gb ?? (memoryStorageMatch ? Number(memoryStorageMatch[2]) : null);
  const graphicsGb = source.graphicsGb ?? source.graphics_gb ?? (graphicsMatch ? Number(graphicsMatch[1]) : null);
  const memory = String(source.memory || source.memory_spec || (ramGb !== null ? `${ramGb} GB` : '')).trim();
  const storage = String(source.storage || source.storage_spec || (storageGb !== null ? `${storageGb} GB` : '')).trim();
  const gpu = String(source.gpu || (graphicsGb !== null ? `${graphicsGb} GB graphics` : '')).trim();
  const configuration = legacyConfiguration || [processor, generation, memory, storage, gpu].filter(Boolean).join(' · ');
  const imageRows = Array.isArray(source.images)
    ? source.images
    : Array.isArray(source.product_images)
      ? source.product_images
      : [];
  const images = imageRows
    .map((image, index) => ({
      id: String(image.id || `${source.id || id}-image-${index}`),
      imageUrl: String(image.imageUrl || image.image_url || ''),
      imagePath: String(image.imagePath || image.image_path || ''),
      position: Number(image.position) || index
    }))
    .filter((image) => image.imageUrl)
    .sort((a, b) => a.position - b.position);
  const legacyImageUrl = String(source.imageUrl || source.image_url || '');
  const legacyImagePath = String(source.imagePath || source.image_path || '');
  if (images.length === 0 && !Array.isArray(source.product_images) && legacyImageUrl) {
    images.push({ id: `${source.id || id}-legacy-image`, imageUrl: legacyImageUrl, imagePath: legacyImagePath, position: 0 });
  }

  return {
    id: String(source.id || id),
    model: legacyModel || [brand, modelNumber].filter(Boolean).join(' '),
    modelNumber,
    brand,
    configuration,
    processor,
    generation: generation || null,
    memory,
    storage,
    gpu,
    display: String(source.display || '').trim(),
    operatingSystem: String(source.operatingSystem || source.operating_system || '').trim(),
    price: Number(source.price) || 0,
    quantity: Math.max(0, Math.floor(Number(source.quantity) || 0)),
    images,
    imageUrl: images[0]?.imageUrl || legacyImageUrl,
    imagePath: images[0]?.imagePath || legacyImagePath
  };
}

export function fromSupabaseProduct(row) {
  return toCatalogProduct(row.id, {
    ...row,
    modelNumber: row.model_number,
    operatingSystem: row.operating_system,
    imageUrl: row.image_url,
    imagePath: row.image_path
  });
}

export function toSupabaseProduct(product) {
  const processor = [product.processor, product.generation]
    .filter(Boolean)
    .join(' · ');

  return {
    id: product.id,
    brand: product.brand,
    model_number: product.modelNumber,
    processor: processor || null,
    memory: product.memory || null,
    storage: product.storage || null,
    gpu: product.gpu || null,
    display: product.display || null,
    operating_system: product.operatingSystem || null,
    price: product.price,
    quantity: product.quantity,
  };
}
