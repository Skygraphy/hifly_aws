import FileDropzone from "./components/FileDropzone.jsx";
import UploadQueue from "./components/UploadQueue.jsx";
import { useUpload } from "./hooks/useUpload.js";

export default function App() {
  const { files, addFiles, removeFile, uploadAll, hasIdle } = useUpload();

  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div data-theme="light" className="min-h-screen bg-base-200">
      <nav className="navbar bg-base-100 shadow-sm px-6">
        <span className="text-xl font-bold tracking-tight">HiFly · S3 Uploader</span>
      </nav>

      <main className="container mx-auto py-10 px-4 max-w-2xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-5">
            <div>
              <h1 className="card-title text-2xl">Bilder hochladen</h1>
              <p className="text-base-content/60 text-sm mt-1">
                Bilder werden direkt zu AWS S3 übertragen.
              </p>
            </div>

            <FileDropzone onFilesSelected={addFiles} />

            <UploadQueue files={files} onRemove={removeFile} />

            {files.length > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-base-content/60">
                  {successCount > 0 && (
                    <span className="text-success font-medium">{successCount} erfolgreich</span>
                  )}
                  {successCount > 0 && errorCount > 0 && " · "}
                  {errorCount > 0 && (
                    <span className="text-error font-medium">{errorCount} fehlgeschlagen</span>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={uploadAll}
                  disabled={!hasIdle}
                >
                  {hasIdle ? "Alle hochladen" : "Alle gestartet"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
