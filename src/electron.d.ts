export {};

declare global {
  interface Window {
    receiptPdf?: {
      saveOne: (payload: {fileName: string; html: string}) => Promise<{saved: boolean; filePath?: string}>;
      saveMany: (payload: {documents: {fileName: string; html: string}[]}) => Promise<{saved: boolean; directory?: string; count?: number}>;
    };
  }
}
