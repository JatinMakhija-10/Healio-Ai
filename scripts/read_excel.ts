import * as xlsx from 'xlsx';
import * as fs from 'fs';
xlsx.set_fs(fs);
import path from 'path';

const filePath = path.resolve(process.cwd(), 'cure_minor.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(JSON.stringify(data.slice(0, 5), null, 2));
