/**
 * mammoth ships types for its Node entry point but not for the browser bundle,
 * which is the one that can run client-side. Only the call we make is declared.
 */
declare module "mammoth/mammoth.browser" {
  export function extractRawText(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<{ value: string; messages: unknown[] }>;
}
