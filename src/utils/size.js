// Sizes are stored as STRINGS, never numbers.
// Jewelry sizes like 2.10 are a different size from 2.1, and Number("2.10")
// collapses them into the same value. Keep the digits exactly as typed.

// "2.10" -> "2.10", 2.4 (legacy number) -> "2.4", " 07 " -> "7", "abc" -> null
export const normalizeSize = (raw) => {
  if (raw === undefined || raw === null) return null;
  const str = String(raw).trim();
  if (!/^\d+(\.\d+)?$/.test(str)) return null;
  const [intPart, frac] = str.split('.');
  const i = String(parseInt(intPart, 10));
  return frac !== undefined ? `${i}.${frac}` : i;
};

export const sizesEqual = (a, b) => {
  const x = normalizeSize(a);
  return x !== null && x === normalizeSize(b);
};

// Sorts 2.2 < 2.4 < 2.8 < 2.10 < 2.12 < 3 (fraction compared as a whole number)
export const compareSizes = (a, b) => {
  const [ai, af = '0'] = String(a).split('.');
  const [bi, bf = '0'] = String(b).split('.');
  return (Number(ai) - Number(bi)) || (Number(af) - Number(bf));
};
