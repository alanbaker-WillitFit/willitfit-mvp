import styles from "@/components/fly/WillItFlyPrelaunch.module.css";

const QUESTIONS = [
  ["↔", "Do they drive on the left or right?"],
  ["£", "What currency is used?"],
  ["◷", "What's the time difference?"],
  ["☼", "What's the weather like?"],
  ["¤", "Is tipping expected?"],
  ["⌁", "Will my hair straighteners work?"],
] as const;

const PROOF = [
  ["✓", "Trusted travel data", "Official and governed sources"],
  ["◎", "Built for travellers", "Practical questions, clear answers"],
  ["▣", "No personal data required", "Use the core experience without signing up"],
  ["⊕", "Growing coverage", "More destinations and topics added regularly"],
] as const;

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div>
            <div className={styles.kicker}><span className={styles.kickerDot} />WillItFly · coming soon</div>
            <h1>Smart answers for <span>every trip.</span></h1>
            <p className={styles.heroLead}>
              WillItFly gives you quick, practical answers to the travel questions that matter most —
              using governed destination data and clear source evidence so you can know before you go.
            </p>

            <ul className={styles.trustList}>
              <li><span className={styles.trustIcon}>?</span><span><strong>Real travel questions</strong><span>Practical answers to the things travellers actually need to know.</span></span></li>
              <li><span className={styles.trustIcon}>◷</span><span><strong>Fast and easy</strong><span>Find the important answer without digging through pages of travel information.</span></span></li>
              <li><span className={styles.trustIcon}>✓</span><span><strong>Trusted information</strong><span>Built from official, governed and reviewed source evidence.</span></span></li>
              <li><span className={styles.trustIcon}>→</span><span><strong>Helpful next steps</strong><span>Relevant guidance that helps you act on the answer.</span></span></li>
            </ul>
          </div>

          <div className={styles.demoWrap} aria-label="Example WillItFly answer">
            <div className={styles.demoHalo} aria-hidden="true" />
            <div className={styles.phone}>
              <div className={styles.phoneTop}><span className={styles.phonePill} /></div>
              <div className={styles.phoneBrand}>WillIt<span>Fly</span></div>
              <p className={styles.phoneTag}>Know Before You Go.</p>
              <div className={styles.field}>
                <label>Where are you travelling?</label>
                <div className={styles.fieldBox}>Japan</div>
              </div>
              <div className={styles.field}>
                <label>What do you want to know?</label>
                <div className={styles.fieldBox}>Will my hair straighteners work?</div>
              </div>
              <div className={styles.answerCard}>
                <div className={styles.answerTitle}><span className={styles.answerTick}>✓</span>Check before you pack.</div>
                <p>Japan uses 100V power and commonly uses Type A plugs. Your device still needs to support the local voltage.</p>
                <div className={styles.nextStep}>Helpful next step · check the voltage label on your device</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.comingSoon} aria-labelledby="coming-soon-title">
        <div className={styles.container}>
          <div className={styles.comingPanel}>
            <div className={styles.comingMark} aria-hidden="true">▣</div>
            <div>
              <h2 id="coming-soon-title">Coming soon</h2>
              <p>WillItFly is being prepared for launch. Destination coverage and travel-question data are being reviewed now.</p>
            </div>
            <div className={styles.statusBadge}>RC1 in preparation</div>
          </div>
        </div>
      </section>

      <section className={styles.questions} aria-labelledby="questions-title">
        <div className={styles.container}>
          <h2 id="questions-title" className={styles.sectionHeading}>Examples of questions WillItFly will answer</h2>
          <div className={styles.questionGrid}>
            {QUESTIONS.map(([icon, question]) => (
              <article className={styles.question} key={question}>
                <span className={styles.questionIcon} aria-hidden="true">{icon}</span>
                <strong>{question}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.proof} aria-label="WillItFly principles">
        <div className={styles.container}>
          <div className={styles.proofGrid}>
            {PROOF.map(([icon, title, detail]) => (
              <article className={styles.proofCard} key={title}>
                <span className={styles.proofIcon} aria-hidden="true">{icon}</span>
                <span><strong>{title}</strong><span>{detail}</span></span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
