import path from 'node:path';
import { loadWorkbook, rows, clean, writeJson, writeCsv } from './common.mjs';
const { filePath, workbook }=loadWorkbook();
const airlines=rows(workbook,'01_Airlines') ?? [];
const rules=rows(workbook,'02_Baggage_Rules') ?? [];
const online=process.argv.includes('--online');
const queue=[];
for (const a of airlines) {
  const id=clean(a.AirlineID), url=clean(a.OfficialBaggageURL);
  const own=rules.filter(r=>clean(r.AirlineID)===id);
  const masterDimensions=own.filter(r=>['Cabin Bag','Personal Item'].includes(clean(r.BagType))).map(r=>`${clean(r.BagType)}: ${r.HeightCm}×${r.WidthCm}×${r.DepthCm} cm`).join('; ');
  let fetchState=url?'not-run':'source-required', httpStatus='', evidence=url?'Online checking disabled unless --online is supplied.':'Official source URL missing.', requiredValidation=url?'Open official source and compare dimensions, weight, baggage wording and fare wording.':'Add and verify the official airline baggage-policy URL.';
  if (online && url) {
    try {
      const res=await fetch(url,{redirect:'follow',headers:{'user-agent':'WillItFit-policy-check/1.0 (+manual-review-only)'},signal:AbortSignal.timeout(12000)});
      httpStatus=String(res.status); fetchState=res.ok?'fetched':'http-error';
      const text=(await res.text()).replace(/\s+/g,' ').slice(0,5000);
      evidence=`Fetched ${text.length} characters. Human comparison required; no master data changed.`;
    } catch(e) { fetchState='fetch-error'; evidence=String(e?.message ?? e); }
  }
  queue.push({AirlineID:id,Airline:clean(a.AirlineName),OfficialSource:url,FetchState:fetchState,HttpStatus:httpStatus,MasterDimensions:masterDimensions,CandidateDimensions:'',MasterWeights:own.map(r=>r.WeightKg).filter(Boolean).join(', '),CandidateWeights:'',Confidence:'Not assessed',RequiredValidation:requiredValidation,Evidence:evidence,ReviewStatus:'Open'});
}
const out=path.resolve('reports/airline-policy-check');
writeJson(path.join(out,'airline-review-queue.json'),{sourceWorkbook:filePath,checkedAt:new Date().toISOString(),online,rows:queue});
writeCsv(path.join(out,'airline-review-queue.csv'),queue,Object.keys(queue[0] ?? {}));
console.log(JSON.stringify({workbook:filePath,airlines:queue.length,online,report:out},null,2));
