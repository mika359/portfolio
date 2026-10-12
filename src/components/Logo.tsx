/** "mlev" wordmark: the domain, shown in code brackets. */
export default function Logo() {
  return (
    <span
      translate="no"
      className="inline-flex items-center font-mono text-lg font-bold leading-none tracking-tight text-accent"
    >
      <span className="text-muted">&lt;</span>
      <span className="glow-text">mlev</span>
      <span className="text-muted">/&gt;</span>
    </span>
  );
}
