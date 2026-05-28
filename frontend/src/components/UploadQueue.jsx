import UploadItem from "./UploadItem.jsx";

export default function UploadQueue({ files, onRemove }) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {files.map((entry) => (
        <UploadItem key={entry.id} entry={entry} onRemove={onRemove} />
      ))}
    </div>
  );
}
