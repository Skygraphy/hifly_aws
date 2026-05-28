import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${API_BASE}/upload`, formData, {
    onUploadProgress: (evt) => {
      if (evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  return res.data; // { key }
}
