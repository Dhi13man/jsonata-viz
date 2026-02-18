/**
 * URL compression/decompression using lz-string.
 * Expression-only by default. 8KB max; fallback to file export if exceeded.
 */

import LZString from "lz-string";

const MAX_URL_BYTES = 8192;
const MAX_DECOMPRESSED_CHARS = 100_000;
const PARAM_EXPR = "e";
const PARAM_INPUT = "i";

interface ShareData {
  expression: string;
  input?: string;
}

/**
 * Encode expression (and optionally input) into URL search params.
 * Returns null if the compressed data exceeds 8KB.
 */
export function encodeShareUrl(data: ShareData): string | null {
  const params = new URLSearchParams();

  const compressedExpr = LZString.compressToEncodedURIComponent(
    data.expression,
  );
  params.set(PARAM_EXPR, compressedExpr);

  if (data.input) {
    const compressedInput = LZString.compressToEncodedURIComponent(data.input);
    params.set(PARAM_INPUT, compressedInput);
  }

  const search = params.toString();
  if (new Blob([search]).size > MAX_URL_BYTES) {
    return null;
  }

  return `${window.location.origin}${window.location.pathname}?${search}`;
}

/**
 * Decode expression and input from URL search params.
 * Returns null if no share data found.
 */
export function decodeShareUrl(
  search: string = window.location.search,
): ShareData | null {
  const params = new URLSearchParams(search);
  const compressedExpr = params.get(PARAM_EXPR);

  if (!compressedExpr) return null;

  const expression =
    LZString.decompressFromEncodedURIComponent(compressedExpr) ?? "";
  if (expression.length > MAX_DECOMPRESSED_CHARS) return null;

  const compressedInput = params.get(PARAM_INPUT);
  const input = compressedInput
    ? (LZString.decompressFromEncodedURIComponent(compressedInput) ?? undefined)
    : undefined;
  if (input && input.length > MAX_DECOMPRESSED_CHARS) return null;

  return { expression, input };
}
