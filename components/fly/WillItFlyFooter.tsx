import styles from "./WillItFlyExperience.module.css";

export default function WillItFlyFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span><strong>Will<span style={{ color: "#22c55e" }}>It</span>Fly</strong> — Know Before You Go.</span>
        <span>Independent travel guidance. Check official requirements before travel.</span>
      </div>
    </footer>
  );
}
