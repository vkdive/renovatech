import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSheet } from 'read-excel-file/node';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function syncStock() {
  const sourceRows = await readSheet(path.join(projectRoot, 'stock_list.xlsx'), 'Stock List');
  const requiredColumns = ['Model', 'Configuration', 'Price', 'Quantity'];
  const headerIndex = sourceRows.findIndex((row) =>
    requiredColumns.every((column) => row.some((cell) => String(cell ?? '').trim() === column))
  );

  if (headerIndex === -1) {
    throw new Error('Could not find Model, Configuration, Price, and Quantity columns in stock_list.xlsx.');
  }

  const headers = sourceRows[headerIndex].map((cell) => String(cell ?? '').trim());
  const columnIndex = Object.fromEntries(requiredColumns.map((column) => [column, headers.indexOf(column)]));
  const ordinal = (value) => `${value}${value % 10 === 1 && value % 100 !== 11 ? 'st' : value % 10 === 2 && value % 100 !== 12 ? 'nd' : value % 10 === 3 && value % 100 !== 13 ? 'rd' : 'th'}`;
  const products = sourceRows.slice(headerIndex + 1).flatMap((row, rowIndex) => {
    const model = String(row[columnIndex.Model] ?? '').trim();
    const configuration = String(row[columnIndex.Configuration] ?? '').trim();
    const rawPrice = row[columnIndex.Price];
    const rawQuantity = row[columnIndex.Quantity];

    if (!model && !configuration && (rawPrice === null || rawPrice === undefined) && (rawQuantity === null || rawQuantity === undefined)) return [];
    if (!model || !configuration || typeof rawPrice !== 'number' || typeof rawQuantity !== 'number') {
      throw new Error(`Incomplete stock row ${headerIndex + rowIndex + 2} in stock_list.xlsx.`);
    }
    if (rawPrice < 0 || rawQuantity < 0) throw new Error(`Negative price or quantity in stock row ${headerIndex + rowIndex + 2}.`);

    const price = rawPrice;
    const quantity = rawQuantity;
    const processorMatch = configuration.match(/\b(i[3579])\s+(\d+)(?:st|nd|rd|th)\b/i);
    const memoryStorageMatch = configuration.match(/(\d+)\s*\/\s*(\d+)/);
    const graphicsMatch = configuration.match(/(\d+)\s*gb?\s+graphics/i);
    const brand = model.match(/^[a-z]+/i)?.[0] ?? 'Other';
    const slug = `${model}-${rowIndex}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return [{
      id: slug,
      model,
      brand: brand.toLowerCase() === 'hp' ? 'HP' : brand[0].toUpperCase() + brand.slice(1).toLowerCase(),
      configuration,
      processor: processorMatch ? `Core ${processorMatch[1].toLowerCase()}` : null,
      generation: processorMatch ? `${ordinal(Number(processorMatch[2]))} Gen` : null,
      ramGb: memoryStorageMatch ? Number(memoryStorageMatch[1]) : null,
      storageGb: memoryStorageMatch ? Number(memoryStorageMatch[2]) : null,
      graphicsGb: graphicsMatch ? Number(graphicsMatch[1]) : null,
      price,
      quantity
    }];
  });

  if (products.length === 0) throw new Error('No product rows found in stock_list.xlsx.');

  await writeFile(path.join(projectRoot, 'src', 'products.json'), `${JSON.stringify(products, null, 2)}\n`);
  return products;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const products = await syncStock();
  console.log(`Loaded ${products.length} products from stock_list.xlsx.`);
}
