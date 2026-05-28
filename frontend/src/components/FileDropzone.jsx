import { useRef, useState } from "react";

export default function FileDropzone({ onFilesSelected }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList) {
    const images = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (images.length > 0) onFilesSelected(images);
  }

  function onDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function onClick() {
    inputRef.current?.click();
  }

  function onChange(e) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-box p-10 text-center cursor-pointer select-none transition-colors
        ${isDragging ? "border-primary bg-primary/5" : "border-base-300 hover:border-primary/50"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.dng"
        multiple
        className="hidden"
        onChange={onChange}
      />
      <div className="flex flex-col items-center gap-2 text-base-content/60">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="font-medium">
          Bilder hier ablegen oder <span className="text-primary">klicken</span>
        </p>
        <p className="text-xs">JPEG, PNG, GIF, WebP, SVG, DNG · Mehrfachauswahl möglich</p>
      </div>
    </div>
  );
}
