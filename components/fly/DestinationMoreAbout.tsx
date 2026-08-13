import type {
  WillItFlyDestinationQuestion,
} from "@/services/willitflyCardsRuntime";
import type { WillItFlyPublicSource } from "@/services/willitflyRuntime";
import styles from "./DestinationCards.module.css";

type Props = {
  destinationName: string;
  questions: WillItFlyDestinationQuestion[];
  publicSources: WillItFlyPublicSource[];
};

export default function DestinationMoreAbout({
  destinationName,
  questions,
  publicSources,
}: Props) {
  if (questions.length === 0) return null;

  const sourceById = new Map(publicSources.map((source) => [source.sourceId, source]));

  return (
    <section className={styles.moreAbout} aria-labelledby="destination-more-about-title">
      <div className={styles.moreAboutHeader}>
        <p className={styles.eyebrow}>More about</p>
        <h2 id="destination-more-about-title">More about {destinationName}</h2>
        <p>Practical follow-up questions supported by governed destination evidence.</p>
      </div>

      <div className={styles.questionList}>
        {questions.map((question) => {
          const source = sourceById.get(question.sourceId);
          return (
            <article className={styles.questionCard} key={question.questionId}>
              <h3>{question.question}</h3>
              <p>{question.answerSummary}</p>
              {(question.lastReviewed || source) ? (
                <div className={styles.questionTrust}>
                  {question.lastReviewed ? <span>Reviewed {question.lastReviewed}</span> : null}
                  {source ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.sourceName} →
                    </a>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
