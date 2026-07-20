import path from 'node:path';
import fs from 'node:fs';
import { loadWorkbook, rows, RUNTIME_CONTRACT, exactLive, ensureDir, writeJson, writeCsv } from './common.mjs';
const { filePath, workbook }=loadWorkbook();
const out=path.resolve('runtime-export'); ensureDir(out);
const manifest={sourceWorkbook:filePath,createdAt:new Date().toISOString(),publication:'MANUAL ONLY',sheets:{}};
for (const [sheet, required] of Object.entries(RUNTIME_CONTRACT)) {
  const all=rows(workbook,sheet) ?? [];
  const live=all.filter(r=>exactLive(r.Status));
  writeCsv(path.join(out,`${sheet}.csv`),live,required);
  manifest.sheets[sheet]={rows:live.length,headers:required};
}
writeJson(path.join(out,'manifest.json'),manifest);
fs.writeFileSync(path.join(out,'README.txt'),'This export does not publish anything. Review the manifest and upload deliberately only after human approval.\n');
console.log(JSON.stringify(manifest,null,2));
