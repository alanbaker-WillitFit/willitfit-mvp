import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDataDiagnostics } from '@/services/diagnostics';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

function diagnosticsEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_DIAGNOSTICS === 'true';
}

export default async function DiagnosticsPage() {
  if (!diagnosticsEnabled()) notFound();
  const diagnostics = await getDataDiagnostics();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Data diagnostics</h1>
      <p className="mt-2 text-sm text-slate-600">Generated {diagnostics.generatedAt}</p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Routing collisions</h2>
        {diagnostics.routingCollisions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No airline and SEO-page slug collisions detected.</p>
        ) : (
          <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
            {diagnostics.routingCollisions.map((collision) => (
              <li key={collision.slug}><code>{collision.slug}</code> is blocked because it belongs to both an airline and an SEO page.</li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead><tr><th className="border p-2 text-left">Sheet</th><th className="border p-2">State</th><th className="border p-2">Rows</th><th className="border p-2">Schema</th><th className="border p-2 text-left">Missing columns</th><th className="border p-2 text-left">Duplicate columns</th><th className="border p-2">Fetched</th><th className="border p-2 text-left">Error</th></tr></thead>
          <tbody>{diagnostics.sheets.map((sheet) => (
            <tr key={sheet.tabName}><td className="border p-2">{sheet.tabName}</td><td className="border p-2 text-center">{sheet.state}</td><td className="border p-2 text-center">{sheet.rowCount}</td><td className="border p-2 text-center">{sheet.schemaValid ? 'Valid' : 'Invalid'}</td><td className="border p-2">{sheet.missingHeaders.join(', ') || '—'}</td><td className="border p-2">{sheet.duplicateHeaders.join(', ') || '—'}</td><td className="border p-2">{sheet.fetchedAt ?? '—'}</td><td className="border p-2">{sheet.error ? 'Data source error recorded' : '—'}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </main>
  );
}
