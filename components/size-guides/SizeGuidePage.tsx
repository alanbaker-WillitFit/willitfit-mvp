import Image from "next/image";
import Link from "next/link";
import TravelEssentials from "@/components/TravelEssentials";
import type { AffiliateSlot } from "@/types";
import type { SizeGuideGroup } from "@/services/sizeGuides";
import styles from "./SizeGuidePage.module.css";

interface SizeGuidePageProps {
  title: string;
  intro: string;
  bagImageSrc: string;
  bagImageAlt: string;
  sectionTitle: string;
  bagTypeQuery: "personalItem" | "cabinBag" | "checkedBag";
  checkerLabel: string;
  groups: SizeGuideGroup[];
  affiliateSlots: AffiliateSlot[];
  source: "sheet" | "fallback";
}

const VISIBLE_AIRLINES = 5;

function SizeGroupCard({ group }: { group: SizeGuideGroup }) {
  const visible = group.airlines.slice(0, VISIBLE_AIRLINES);
  const remaining = group.airlines.slice(VISIBLE_AIRLINES);

  return (
    <article className={styles.card}>
      <strong className={styles.metric}>{group.metricLabel}</strong>
      <span className={styles.imperial}>{group.imperialLabel}</span>
      <ul className={styles.airlines}>
        {visible.map((airline) => (
          <li key={airline.airlineId}>
            <Link href={`/airlines/${airline.slug}`}>{airline.airlineName}</Link>
          </li>
        ))}
      </ul>
      {remaining.length > 0 ? (
        <details className={styles.more}>
          <summary>+ {remaining.length} more airlines</summary>
          <ul className={styles.airlines}>
            {remaining.map((airline) => (
              <li key={airline.airlineId}>
                <Link href={`/airlines/${airline.slug}`}>{airline.airlineName}</Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}

export default function SizeGuidePage({
  title,
  intro,
  bagImageSrc,
  bagImageAlt,
  sectionTitle,
  bagTypeQuery,
  checkerLabel,
  groups,
  affiliateSlots,
  source,
}: SizeGuidePageProps) {
  const featuredGroups = groups.slice(0, 6);
  const additionalGroups = groups.slice(6);

  return (
    <div className={`${styles.page} wf-container`}>
      <section className={styles.hero} aria-labelledby="size-guide-title">
        <p className={styles.eyebrow}>Size Guide</p>
        <h1 id="size-guide-title" className={styles.title}>{title}</h1>
        <p className={styles.intro}>{intro}</p>

        <div className={styles.bagStage}>
          <Image
            src={bagImageSrc}
            alt={bagImageAlt}
            fill
            priority
            sizes="(max-width: 720px) 90vw, 544px"
            className={styles.bagImage}
          />
          <span className={`${styles.measurement} ${styles.height}`} aria-hidden="true"><span>Height</span></span>
          <span className={`${styles.measurement} ${styles.width}`} aria-hidden="true"><span>Width</span></span>
          <span className={`${styles.measurement} ${styles.depth}`} aria-hidden="true"><span>Depth</span></span>
        </div>
      </section>

      <section aria-labelledby="common-sizes-heading">
        <h2 id="common-sizes-heading" className={styles.sectionTitle}>{sectionTitle}</h2>
        {featuredGroups.length > 0 ? (
          <div className={styles.grid}>
            {featuredGroups.map((group) => <SizeGroupCard key={group.key} group={group} />)}
          </div>
        ) : (
          <div className={styles.cta}>
            <h2>No published size groups are available yet.</h2>
            <p>Use the checker to review your airline directly.</p>
          </div>
        )}
      </section>

      {additionalGroups.length > 0 ? (
        <details className={styles.more}>
          <summary>Show {additionalGroups.length} more published sizes</summary>
          <div className={styles.grid}>
            {additionalGroups.map((group) => <SizeGroupCard key={group.key} group={group} />)}
          </div>
        </details>
      ) : null}

      <section className={styles.cta} aria-labelledby="size-guide-cta-heading">
        <h2 id="size-guide-cta-heading">Not seeing your airline?</h2>
        <p>Use the WillItFit checker to confirm the exact allowance for your airline and fare.</p>
        <Link href={`/?bagType=${bagTypeQuery}#checker`}>{checkerLabel}</Link>
      </section>

      <section className={styles.knowledge} aria-label="Things to know">
        <article><strong>Measurements</strong><p>Published dimensions normally include wheels and handles.</p></article>
        <article><strong>Weight limits</strong><p>Airlines may apply a separate maximum weight.</p></article>
        <article><strong>Fare type matters</strong><p>Your ticket or priority option may change the allowance.</p></article>
        <article><strong>Always check</strong><p>Confirm the current rule for your booking before travel.</p></article>
      </section>

      <TravelEssentials variant="grid" slots={affiliateSlots} />
      <p className={styles.source}>Runtime source: {source === "sheet" ? "Google Sheets" : "validated local fallback"}.</p>
    </div>
  );
}
