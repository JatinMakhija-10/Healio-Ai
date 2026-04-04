import * as xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'cure_minor.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows:', rawData.length);
if (rawData.length > 0) {
    console.log('First row example:', rawData[0]);
    console.log('Second row example:', rawData[1]);
}
