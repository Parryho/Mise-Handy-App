// OCR functions for extracting text from images and PDFs

export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Dynamic import so Vite code-splits tesseract.js (~2MB)
  const Tesseract = await import("tesseract.js");

  const result = await Tesseract.recognize(file, "deu+eng", {
    logger: (m: any) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  return result.data.text;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/ocr/pdf", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "PDF-Extraktion fehlgeschlagen");
  }

  const data = await res.json();
  return data.text;
}
