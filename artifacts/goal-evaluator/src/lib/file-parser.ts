import * as XLSX from "xlsx";

/**
 * Extracts raw text from uploaded files to send to the AI backend.
 * Handles .xlsx, .csv, and .txt files.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          let fullText = `--- FILE: ${file.name} ---\n`;
          
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            if (csv.trim()) {
              fullText += `\n[Sheet: ${sheetName}]\n${csv}\n`;
            }
          });
          resolve(fullText);
        } catch (err) {
          reject(new Error("Excel 파일 파싱에 실패했습니다."));
        }
      };
      reader.onerror = () => reject(new Error("파일 읽기 오류"));
      reader.readAsArrayBuffer(file);
    });
  }

  // Fallback for CSV, TXT, etc.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(`--- FILE: ${file.name} ---\n` + (e.target?.result as string));
    reader.onerror = () => reject(new Error("파일 읽기 오류"));
    reader.readAsText(file);
  });
}
