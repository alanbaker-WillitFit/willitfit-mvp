import { getSheetDiagnostics } from './googleSheets';
import { getCachedAirlines } from './airlines';
import { getCachedSeoPages } from './seoPages';
import { findRoutingCollisions, type RoutingCollision } from '@/lib/routingCollisions';

export type DataDiagnostics = {
  generatedAt: string;
  sheets: ReturnType<typeof getSheetDiagnostics>;
  routingCollisions: RoutingCollision[];
};

export async function getDataDiagnostics(): Promise<DataDiagnostics> {
  const [{ airlines }, seoPages] = await Promise.all([
    getCachedAirlines(),
    getCachedSeoPages(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    sheets: getSheetDiagnostics(),
    routingCollisions: findRoutingCollisions(
      airlines.map((airline) => airline.slug),
      seoPages.map((page) => page.pageSlug)
    ),
  };
}
