import { describe, expect, it } from 'vitest';
import raw from '@/data/certified/04.1_Special_Baggage_Results.json';
import { SPECIAL_BAGGAGE_CATEGORY_IDS, mapSpecialBaggageResult } from '@/services/specialBaggage';

function toRows(matrix: unknown[][]): Record<string,string>[] {
  const headers=(matrix[0]||[]).map(v=>String(v??'').trim());
  return matrix.slice(1).flatMap(row=>{
    if(!Array.isArray(row) || !row.some(v=>String(v??'').trim())) return [];
    const out:Record<string,string>={};
    headers.forEach((h,i)=>{ if(h) out[h]=String(row[i]??'').trim(); });
    return [out];
  });
}

describe('special baggage publication contract',()=>{
  it('publishes exactly the mapped canonical catalogue',()=>{
    const rows=toRows(raw as unknown[][]);
    const published=rows.filter(r=>['true','yes','1','published','live'].includes(String(r.Publish||'').trim().toLowerCase()));
    const mapped=published.map(mapSpecialBaggageResult).filter(Boolean);
    expect(published).toHaveLength(SPECIAL_BAGGAGE_CATEGORY_IDS.length);
    expect(mapped).toHaveLength(SPECIAL_BAGGAGE_CATEGORY_IDS.length);
    expect(new Set(mapped.map(x=>x!.categoryId))).toEqual(new Set(SPECIAL_BAGGAGE_CATEGORY_IDS));
  });

  it('does not mark unmapped extension rows as published',()=>{
    const rows=toRows(raw as unknown[][]);
    const bad=rows.filter(r=>['true','yes','1','published','live'].includes(String(r.Publish||'').trim().toLowerCase()) && !mapSpecialBaggageResult(r));
    expect(bad).toEqual([]);
  });
});
