import { useState, useCallback } from "react";
import { uploadFile } from "../services/uploadService.js";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useUpload() {
  const [files, setFiles] = useState([]);

  function updateFile(id, patch) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  const addFiles = useCallback((newFiles) => {
    setFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.file.name}-${f.file.size}`));
      const toAdd = newFiles
        .filter((f) => !existingKeys.has(`${f.name}-${f.size}`))
        .map((f) => ({ id: makeId(), file: f, progress: 0, status: "idle", error: null }));
      return [...prev, ...toAdd];
    });
  }, []);

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  async function uploadSingle(entry) {
    updateFile(entry.id, { status: "uploading", progress: 0, error: null });
    try {
      await uploadFile(entry.file, (pct) => {
        updateFile(entry.id, { progress: pct });
      });
      updateFile(entry.id, { status: "success", progress: 100 });
    } catch (err) {
      const message = err.response?.data?.error ?? err.message;
      updateFile(entry.id, { status: "error", error: message });
    }
  }

  const uploadAll = useCallback(() => {
    const pending = files.filter((f) => f.status === "idle");
    pending.forEach(uploadSingle);
  }, [files]);

  const hasIdle = files.some((f) => f.status === "idle");

  return { files, addFiles, removeFile, uploadAll, hasIdle };
}
