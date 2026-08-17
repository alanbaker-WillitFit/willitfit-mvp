import type { ResolvedTopicCard } from "@/lib/willitflyCards";
import styles from "./DestinationCards.module.css";

export type TopicSummaryCardProps = {
  card: ResolvedTopicCard;
};

type FactLine = {
  label: string;
  value: string;
};

const CONTROLLED_LABELS: Record<string, string> = {
  MOBILE_COVERAGE_AVAILABLE_VARIES_BY_OPERATOR_LOCATION: "Mobile coverage varies by operator and location",
  MOBILE_SERVICE_AVAILABLE_COVERAGE_NOT_ESTABLISHED: "Mobile service available; check local coverage",
  SIM_AND_ESIM_AVAILABLE: "SIM and eSIM available",
  SIM_AVAILABLE_ESIM_NOT_CONFIRMED: "SIM available; eSIM not confirmed",
  CARDS_CONTACTLESS_COMMON_CASH_AVAILABLE: "Cards/contactless common; cash available",
  CARDS_AND_CASH_AVAILABLE_CHECK_ACCEPTANCE: "Cards and cash available; check acceptance",
  CASH_AVAILABLE_CHECK_CARD_ACCEPTANCE: "Cash available; check card acceptance",
  PAYMENT_SYSTEMS_AVAILABLE_CHECK_CASH_CARD_ACCEPTANCE: "Check cash and card acceptance",
  CHECK_OFFICIAL_REQUIREMENTS: "Check official requirements",
};

const ENTRY_CONTEXT_LIMITATION =
  "Entry requirements depend on passport, residence, route, purpose and travel date. WillItFly does not determine personal eligibility in RC1.";

function TopicIcon({ topicId }: { topicId: ResolvedTopicCard["topicId"] }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (topicId) {
    case "POWER":
      return <svg {...common}><path d="M8 3v6M16 3v6M6 9h12v3a6 6 0 0 1-12 0V9ZM12 18v3" /></svg>;
    case "CONNECTIVITY":
      return <svg {...common}><path d="M4 9a12 12 0 0 1 16 0M7 12a8 8 0 0 1 10 0M10 15a4 4 0 0 1 4 0" /><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" /></svg>;
    case "MONEY":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 15h4" /></svg>;
    case "ENTRY":
      return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M9 7h6M9 11h4M9 16h6" /></svg>;
    case "WEATHER":
      return <svg {...common}><path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 9.4 4.5 4.5 0 0 0 7 18Z" /><path d="M16 4V2M20 6l1.5-1.5M12 5l-1.5-1.5" /></svg>;
  }
}

function controlledLabel(value: unknown): string {
  if (typeof value !== "string") return "";
  return CONTROLLED_LABELS[value] || value.replace(/_/g, " ").toLowerCase();
}

function factLines(card: ResolvedTopicCard): FactLine[] {
  if (card.status === "unavailable") return [];

  switch (card.topicId) {
    case "POWER": {
      const plugs = Array.isArray(card.fields.plugTypeIds) ? card.fields.plugTypeIds.join(" / ") : "";
      return [
        { label: "Voltage", value: card.fields.voltage ? `${card.fields.voltage} V` : "" },
        { label: "Frequency", value: card.fields.frequency ? `${card.fields.frequency} Hz` : "" },
        { label: "Plug", value: plugs ? `Type ${plugs}` : "" },
        { label: "Adapter", value: controlledLabel(card.fields.adapterImplication) },
      ].filter((line) => Boolean(line.value));
    }
    case "CONNECTIVITY":
      return [
        { label: "Coverage", value: controlledLabel(card.fields.coverageStatus) },
        { label: "SIM / eSIM", value: controlledLabel(card.fields.simEsim) },
      ].filter((line) => Boolean(line.value));
    case "MONEY":
      return [
        { label: "Currency", value: typeof card.fields.currencyCode === "string" ? card.fields.currencyCode : "" },
        { label: "Payments", value: controlledLabel(card.fields.paymentReality) },
      ].filter((line) => Boolean(line.value));
    case "ENTRY":
      return [
        { label: "Entry", value: controlledLabel(card.fields.entryPosition) },
      ].filter((line) => Boolean(line.value));
    case "WEATHER":
      return [
        { label: "Climate", value: typeof card.fields.climateGuidance === "string" ? card.fields.climateGuidance : "" },
      ].filter((line) => Boolean(line.value));
  }
}

function statusLabel(card: ResolvedTopicCard): string {
  if (card.status === "ready") return "Reviewed";
  if (card.status === "official-confirmation-required") return "Official check";
  return "Unavailable";
}

function statusClass(card: ResolvedTopicCard): string {
  if (card.status === "ready") return `${styles.status} ${styles.statusReady}`;
  if (card.status === "official-confirmation-required") return `${styles.status} ${styles.statusConfirm}`;
  return `${styles.status} ${styles.statusUnavailable}`;
}

export default function TopicSummaryCard({ card }: TopicSummaryCardProps) {
  const lines = factLines(card);
  const summaryLines = lines.slice(0, 2);
  const detailLines = lines.slice(2);

  return (
    <article className={styles.topicCard} data-topic={card.topicId} data-status={card.status}>
      <div className={styles.topicIcon}><TopicIcon topicId={card.topicId} /></div>
      <h2>{card.title}</h2>
      <span className={statusClass(card)}>{statusLabel(card)}</span>

      {card.status === "unavailable" ? (
        <p className={styles.message}>Not yet available. WillItFly will not guess.</p>
      ) : (
        <>
          {summaryLines.length > 0 ? (
            <dl className={styles.summaryFacts}>
              {summaryLines.map((line) => (
                <div key={`${card.cardId}-${line.label}`}>
                  <dt>{line.label}</dt>
                  <dd>{line.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {(detailLines.length > 0 || card.topicId === "ENTRY" || card.publicSource) ? (
            <details className={styles.cardDetails}>
              <summary>Details</summary>
              {detailLines.length > 0 ? (
                <dl className={styles.detailFacts}>
                  {detailLines.map((line) => (
                    <div key={`${card.cardId}-detail-${line.label}`}>
                      <dt>{line.label}</dt>
                      <dd>{line.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {card.topicId === "ENTRY" && card.status === "official-confirmation-required" ? (
                <p>{ENTRY_CONTEXT_LIMITATION}</p>
              ) : null}
              {card.status === "official-confirmation-required" && card.publicSource ? (
                <a href={card.publicSource.url} target="_blank" rel="noopener noreferrer">
                  Check official requirements →
                </a>
              ) : null}
            </details>
          ) : null}
        </>
      )}

      {card.lastReviewed ? (
        <div className={styles.trustMeta}>Reviewed {card.lastReviewed}</div>
      ) : null}
    </article>
  );
}
