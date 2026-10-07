import airlines from '@/data/certified/02_Airlines.json';
import airlineRules from '@/data/certified/03_Airline_Rules.json';
import specialResults from '@/data/certified/04.1_Special_Baggage_Results.json';
import faqs from '@/data/certified/05_FAQs.json';
import tips from '@/data/certified/06_Tips.json';
import siteContent from '@/data/certified/07_Site_Content.json';
import seoPages from '@/data/certified/08_SEO_Pages.json';
import articles from '@/data/certified/08.2_Articles.json';
import articleSections from '@/data/certified/08.2.1_Article_Sections.json';
import runtimeAirports from '@/data/certified/runtime_airports.json';
import affiliatePlacements from '@/data/certified/09_Affiliate_Placements.json';
import lab from '@/data/certified/10_Lab.json';

type Row = Record<string,string>;
type Matrix = unknown[][];

function matrixToRows(matrix: Matrix): Row[] {
  if (!Array.isArray(matrix) || matrix.length < 2) return [];
  const headers=(matrix[0] || []).map(v=>String(v ?? '').trim());
  return matrix.slice(1).flatMap(raw=>{
    if (!Array.isArray(raw) || !raw.some(v=>String(v ?? '').trim())) return [];
    const row:Row={};
    headers.forEach((h,i)=>{ if(h && !(h in row)) row[h]=String(raw[i] ?? '').trim(); });
    return [row];
  });
}

const SNAPSHOTS: Record<string, Matrix> = {
  '02_Airlines': airlines as Matrix,
  '03_Airline Rules': airlineRules as Matrix,
  '04.1_Special Baggage Results': specialResults as Matrix,
  '05_FAQs': faqs as Matrix,
  '06_Tips': tips as Matrix,
  '07_Site Content': siteContent as Matrix,
  '08_SEO_Pages': seoPages as Matrix,
  '08.2_Articles': articles as Matrix,
  '08.2.1_Article_Sections': articleSections as Matrix,
  'runtime_airports': runtimeAirports as Matrix,
  '09_Affiliate_Placements': affiliatePlacements as Matrix,
  '10_Lab': lab as Matrix,
};

export function getCertifiedSnapshotRows(tabName:string): Row[] | undefined {
  const matrix=SNAPSHOTS[tabName];
  return matrix ? matrixToRows(matrix) : undefined;
}
