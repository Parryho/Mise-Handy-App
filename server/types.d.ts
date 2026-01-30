declare module "pdf-parse" {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, any>;
  }
  function pdfParse(dataBuffer: Buffer): Promise<PDFData>;
  export = pdfParse;
}
