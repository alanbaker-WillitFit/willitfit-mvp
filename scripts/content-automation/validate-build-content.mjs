import path from 'node:path';
import { loadWorkbook, rows, headers, RUNTIME_CONTRACT, clean, slugOk, positiveDimension, writeJson, writeCsv } from './common.mjs';

const { filePath, workbook } = loadWorkbook();
const findings=[];
const add=(severity,area,record,field,finding,requiredAction,evidence='')=>findings.push({severity,area,record,field,finding,requiredAction,evidence});

for (const [sheet, required] of Object.entries(RUNTIME_CONTRACT)) {
  const actual=headers(workbook,sheet);
  if (!actual.length) { add('BLOCKER',sheet,'Sheet','Headers','Required runtime sheet is missing.','Restore the runtime sheet.',`Expected: ${required.join(', ')}`); continue; }
  const dup=actual.filter((h,i)=>actual.indexOf(h)!==i);
  for (const h of required.filter(h=>!actual.includes(h))) add('BLOCKER',sheet,'Header',h,'Required exact header is missing.','Restore the exact case-sensitive header.',`Headers: ${actual.join(', ')}`);
  for (const h of [...new Set(dup)]) add('BLOCKER',sheet,'Header',h,'Duplicate header detected.','Remove or rename the duplicate header.');
}

const airlines=rows(workbook,'01_Airlines') ?? [];
const airlineIds=new Set();
for (const row of airlines) {
  const id=clean(row.AirlineID); const status=clean(row.Status);
  if (!id) add('BLOCKER','01_Airlines','Row','AirlineID','AirlineID is blank.','Assign a stable AirlineID.');
  else if (airlineIds.has(id)) add('BLOCKER','01_Airlines',id,'AirlineID','Duplicate AirlineID.','Merge or correct the duplicate ID.');
  airlineIds.add(id);
  if (status==='Live') {
    if (!slugOk(row.Slug)) add('BLOCKER','01_Airlines',id,'Slug','Live airline has an invalid slug.','Use lowercase hyphenated slug.');
    if (!/^https:\/\//i.test(clean(row.OfficialBaggageURL))) add('BLOCKER','01_Airlines',id,'OfficialBaggageURL','Live airline lacks an HTTPS official baggage URL.','Add and verify the official airline policy URL.');
  }
}

const rules=rows(workbook,'02_Baggage_Rules') ?? [];
const ruleIds=new Set();
for (const row of rules) {
  const id=clean(row.RuleID); const status=clean(row.Status); const master=clean(row.MasterPublishStatus);
  const draftPlaceholder = status==='Draft' && master==='Review';
  if (!id) add('BLOCKER','02_Baggage_Rules','Row','RuleID','RuleID is blank.','Assign a stable RuleID.');
  else if (ruleIds.has(id)) add('BLOCKER','02_Baggage_Rules',id,'RuleID','Duplicate RuleID.','Merge or correct duplicate rule.');
  ruleIds.add(id);
  if (clean(row.AirlineID) && !airlineIds.has(clean(row.AirlineID))) add('BLOCKER','02_Baggage_Rules',id,'AirlineID','Rule references an unknown airline.','Correct the relationship.');
  if (!draftPlaceholder && status==='Live') {
    if (!['Cabin Bag','Personal Item'].includes(clean(row.BagType))) add('BLOCKER','02_Baggage_Rules',id,'BagType','Live rule has unsupported BagType.','Use Cabin Bag or Personal Item.');
    for (const f of ['HeightCm','WidthCm','DepthCm']) if (!positiveDimension(row[f])) add('BLOCKER','02_Baggage_Rules',id,f,'Live rule has an invalid dimension.','Enter a verified value from 1–150 cm.');
  }
}

const tips=rows(workbook,'06_Travel_Tips') ?? [];
const liveTips=tips.filter(r=>clean(r.Status)==='Live');
const seenTip=new Set(), seenSlug=new Set();
for (const row of liveTips) {
  const id=clean(row.TipID), slug=clean(row.Slug);
  if (seenTip.has(id)) add('WARNING','06_Travel_Tips',id,'TipID','Duplicate Live TipID.','Deduplicate before runtime export.');
  if (seenSlug.has(slug)) add('WARNING','06_Travel_Tips',id,'Slug','Duplicate Live slug.','Deduplicate before runtime export.');
  seenTip.add(id); seenSlug.add(slug);
  if (/WillitFit/.test(JSON.stringify(row))) add('WARNING','06_Travel_Tips',id,'Brand','Incorrect WillitFit spelling.','Replace with WillItFit.');
}

if ((rows(workbook,'Content Engine') ?? []).length && !headers(workbook,'Content Engine').includes('TipID')) {
  add('WARNING','Content Engine','Sheet','Headers','Preferred tips sheet exists but lacks the expected TipID header.','Use 06_Travel_Tips until the Content Engine contract is explicitly supported.');
}

const summary={workbook:filePath,checkedAt:new Date().toISOString(),blockers:findings.filter(f=>f.severity==='BLOCKER').length,warnings:findings.filter(f=>f.severity==='WARNING').length,findings};
const out=path.resolve('reports/content-validation');
writeJson(path.join(out,'validation.json'),summary);
writeCsv(path.join(out,'validation.csv'),findings,['severity','area','record','field','finding','requiredAction','evidence']);
console.log(JSON.stringify({workbook:filePath,blockers:summary.blockers,warnings:summary.warnings,report:out},null,2));
process.exitCode=summary.blockers ? 1 : 0;
