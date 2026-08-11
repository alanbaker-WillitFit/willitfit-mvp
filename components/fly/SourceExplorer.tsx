"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/app/fly/sources/SourceExplorer.module.css";

export type SourceExplorerCountry = {
  destinationId: string;
  slug: string;
  displayName: string;
  flagEmoji?: string;
  aliases: string[];
  sourceCount: number;
  topics: string[];
};

const PAGE_SIZE = 32;

function normalise(value: string) {
  return value.trim().toLowerCase();
}

export default function SourceExplorer({ countries }: { countries: SourceExplorerCountry[] }) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const needle = normalise(query);
    if (!needle) return countries;
    return countries.filter((country) => {
      const haystack = [country.displayName, ...country.aliases, ...country.topics].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [countries, query]);

  const searching = normalise(query).length > 0;
  const visible = searching ? filtered : filtered.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  useEffect(() => {
    if (searching || visibleCount >= filtered.length || !sentinelRef.current) return;
    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length, searching, visibleCount]);

  return (
    <section className={styles.catalogue} aria-labelledby="source-catalogue-title">
      <div className={styles.catalogueHeader}>
        <div>
          <p className={styles.eyebrow}>Source Explorer</p>
          <h2 id="source-catalogue-title">Browse by country</h2>
        </div>
        <p className={styles.catalogueCount}>
          {searching ? `${filtered.length} matching ${filtered.length === 1 ? "country" : "countries"}` : `${countries.length} countries`}
        </p>
      </div>

      <label className={styles.searchBox}>
        <span className="sr-only">Search countries and source topics</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a country or source topic"
          autoComplete="off"
        />
        {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button> : null}
      </label>

      {visible.length > 0 ? (
        <div className={styles.countryGrid}>
          {visible.map((country) => (
            <Link className={`wf-card ${styles.countryCard}`} href={`/fly/sources/${country.slug}`} key={country.destinationId}>
              <span className={styles.countryFlag} aria-hidden="true">{country.flagEmoji || "◦"}</span>
              <strong>{country.displayName}</strong>
              <span className={styles.sourceCount}>{country.sourceCount} public {country.sourceCount === 1 ? "source" : "sources"}</span>
              <span className={styles.viewLabel}>Explore sources <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className={`wf-card ${styles.emptyState}`}>
          <strong>No matching country</strong>
          <p>Try another country name or source topic.</p>
        </div>
      )}

      {!searching && visibleCount < filtered.length ? (
        <div className={styles.sentinel} ref={sentinelRef} aria-hidden="true">
          <span>Loading more countries…</span>
        </div>
      ) : null}
    </section>
  );
}
