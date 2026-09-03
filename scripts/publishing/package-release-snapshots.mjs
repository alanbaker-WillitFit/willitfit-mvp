import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => { const [key,...rest]=arg.replace(/^--/,"").split("="); return [key,rest.length?rest.join("="):"true"]; }));
const currentDir=args.get("current-dir")?resolve(args.get("current-dir")):null;
const previousDir=args.get("previous-dir")?resolve(args.get("previous-dir")):null;
const outputRoot=resolve(args.get("output-root")??"public/data");
if(!currentDir||!previousDir)throw new Error("--current-dir and --previous-dir are required; production builds must contain two real certified generations");
async function loadManifest(dir){const path=join(dir,"snapshot-generation-manifest.v1.json"),m=JSON.parse(await readFile(path,"utf8"));if(m.status!=="PASS"||!m.generationId||!m.outputHashes)throw new Error(`${path}: generation is not certified PASS`);return m}
async function verifyHashes(dir,m){const names={aliases:"willitfit-airline-operational-aliases.v1.json",pages:"willitfit-pages.v1.json",airlines:"willitfit-airlines.v1.json",rules:"willitfit-airline-rules.v1.json",airports:"willitfit-airports.v1.json",airportReferences:"willitfit-airport-reference.v1.json",commercial:"willitfit-commercial.v1.json",runtimeTabs:"willitfit-runtime-tabs.v1.json"},fail=[];for(const [key,expected] of Object.entries(m.outputHashes)){const name=names[key];if(!name)continue;const actual=createHash("sha256").update(await readFile(join(dir,name))).digest("hex");if(actual!==expected)fail.push(`${name}: ${actual} != ${expected}`)}if(fail.length)throw new Error(`Snapshot hash verification failed:\n${fail.join("\n")}`)}
const current=await loadManifest(currentDir),previous=await loadManifest(previousDir);if(current.generationId===previous.generationId)throw new Error("CURRENT and PREVIOUS must be different certified generation IDs");await Promise.all([verifyHashes(currentDir,current),verifyHashes(previousDir,previous)]);
for(const slot of ["current","previous"])await rm(join(outputRoot,slot),{recursive:true,force:true});await mkdir(outputRoot,{recursive:true});await cp(currentDir,join(outputRoot,"current","v1"),{recursive:true});await cp(previousDir,join(outputRoot,"previous","v1"),{recursive:true});
const release={contractVersion:"1.0.0",generatedAt:new Date().toISOString(),current:{generationId:current.generationId,outputHashes:current.outputHashes},previous:{generationId:previous.generationId,outputHashes:previous.outputHashes},fallbackOrder:["current","previous","fail_closed"],sheetsFallbackAllowed:false,publicDataOnly:true};await writeFile(join(outputRoot,"release-snapshot-manifest.v1.json"),`${JSON.stringify(release,null,2)}\n`);console.log(JSON.stringify(release,null,2));
