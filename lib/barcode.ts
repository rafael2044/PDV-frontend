export interface BalanceBarcodeResult {
  isBalanceBarcode: boolean;
  productCode: string;
  weightGrams: number;
  weightKg: number;
  valid: boolean;
}

export function parseBalanceBarcode(code: string): BalanceBarcodeResult {
  const empty: BalanceBarcodeResult = {
    isBalanceBarcode: false,
    productCode: "",
    weightGrams: 0,
    weightKg: 0,
    valid: false,
  };

  if (!/^\d{13}$/.test(code)) return empty;

  if (code[0] !== "2") return empty;

  const productCode = code.substring(1, 7);
  const weightGrams = parseInt(code.substring(7, 12), 10);
  const weightKg = weightGrams / 1000;

  const valid = validateEAN13CheckDigit(code);

  return {
    isBalanceBarcode: true,
    productCode,
    weightGrams,
    weightKg,
    valid,
  };
}

export function validateEAN13CheckDigit(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;

  const digits = code.split("").map(Number);
  const checkDigit = digits[12];

  const weights = [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 10;
  const expected = remainder === 0 ? 0 : 10 - remainder;

  return checkDigit === expected;
}

export function findProductForBarcode(
  code: string,
  products: { barcode?: string | null }[]
): { barcode?: string | null } | undefined {
  const exact = products.find((p) => p.barcode === code);
  if (exact) return exact;

  const balance = parseBalanceBarcode(code);
  if (balance.isBalanceBarcode && balance.valid) {
    return products.find((p) => p.barcode === balance.productCode);
  }

  return undefined;
}
