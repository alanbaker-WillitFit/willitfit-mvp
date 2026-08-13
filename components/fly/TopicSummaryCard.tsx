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
  MOBILE_COVERAGE_AVAILABLE_VARIES_BY_OPERATOR_LOCATION: "Mobile coverage is available and varies by operator and location",
  MOBILE_SERVICE_AVAILABLE_COVERAGE_NOT_ESTABLISHED: "Mobile service is available; local coverage should be checked",
  SIM_AND_ESIM_AVAILABLE: "SIM and eSIM options are available",
  SIM_AVAILABLE_ESIM_NOT_CONFIRMED: "SIM options are available; eSIM has not been confirmed",
  CARDS_CONTACTLESS_COMMON_CASH_AVAILABLE: "Cards and contactless are common; cash remains available",
  CARDS_AND_CASH_AVAILABLE_CHECK_ACCEPTANCE: "Cards and cash are available; check individual acceptance",
  CASH_AVAILABLE_CHECK_CARD_ACCEPTANCE: "Cash is available; check individual card acceptance",
  PAYMENT_SYSTEMS_AVAILABLE_CHECK_CASH_CARD_ACCEPTANCE: "Payment systems are available; check cash and card acceptance",
  CHECK_OFFICIAL_REQUIREMENTS: "Check the official entry requirements for your circumstances",
};

const ENTRY_CONTEXT_LIMITATION =
  "Entry requirements depend on your passport, residence, route, purpose and travel date. WillItFly does not determine personal eligibility in RC1.";

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
        { label: "Plug type", value: plugs ? `Type ${plugs}` : "" },
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
  if (card.status === "ready") return "Ready";
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

  return (
    <article className={styles.topicCard} data-topic={card.topicId} data-status={card.status}>
      <div className={styles.topicHeader}>
        <h2>{card.title}</h2>
        <span className={statusClass(card)}>{statusLabel(card)}</span>
      </div>

      {card.status === "unavailable" ? (
        <p className={styles.message}>This information is still being prepared. WillItFly will not guess or substitute unsupported data.</p>
      ) : (
        <>
          {lines.length > 0 ? (
            <div className={styles.factGrid}>
              {lines.map((line) => (
                <div className={styles.fact} key={`${card.cardId}-${line.label}`}>
                  <span className={styles.factLabel}>{line.label}</span>
                  <span className={styles.factValue}>{line.value}</span>
                </div>
              ))}
            </div>
          ) : null}

          {card.topicId === "ENTRY" && card.status === "official-confirmation-required" ? (
            <p className={styles.message}>{ENTRY_CONTEXT_LIMITATION}</p>
          ) : null}

          {card.status === "official-confirmation-required" && card.publicSource ? (
            <a
              className={styles.sourceLink}
              href={card.publicSource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Check official requirements →
            </a>
          ) : null}
        </>
      )}

      {card.lastReviewed ? (
        <div className={styles.trustMeta}>Reviewed {card.lastReviewed}</div>
      ) : null}
    </article>
  );
}
