import StatusBadge from "./StatusBadge.jsx";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadItem({ entry, onRemove }) {
  const { id, file, progress, status, error } = entry;

  return (
    <div className="flex flex-col gap-1 p-3 bg-base-200 rounded-box">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-medium">{file.name}</span>
          <span className="text-xs text-base-content/50 shrink-0">
            {formatBytes(file.size)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={status} />
          {status !== "uploading" && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => onRemove(id)}
              aria-label="Entfernen"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {status === "uploading" && (
        <progress
          className="progress progress-primary w-full"
          value={progress}
          max="100"
        />
      )}

      {status === "error" && error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
