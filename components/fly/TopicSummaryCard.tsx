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

const TOPIC_SYMBOLS: Record<ResolvedTopicCard["topicId"], string> = {
  POWER: "⌁",
  CONNECTIVITY: "◉",
  MONEY: "▭",
  ENTRY: "◇",
  WEATHER: "☼",
};

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
      <div className={styles.topicIcon} aria-hidden="true">{TOPIC_SYMBOLS[card.topicId]}</div>
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
