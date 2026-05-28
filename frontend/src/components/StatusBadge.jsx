const badgeClass = {
  idle: "badge-neutral",
  uploading: "badge-info",
  success: "badge-success",
  error: "badge-error",
};

const label = {
  idle: "Wartend",
  uploading: "Lädt hoch…",
  success: "Fertig",
  error: "Fehler",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-sm ${badgeClass[status] ?? "badge-neutral"}`}>
      {label[status] ?? status}
    </span>
  );
}
