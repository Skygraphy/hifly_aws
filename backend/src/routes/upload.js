import { Router } from "express";
import busboy from "busboy";
import { randomUUID } from "crypto";
import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "../config/s3.js";

const router = Router();

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/x-adobe-dng",
  "image/dng",
]);

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

router.post("/", (req, res, next) => {
  const bb = busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE } });
  let uploadPromise = null;
  let fileMimeType = "";
  let fileExtension = "";
  let limitExceeded = false;

  bb.on("file", (fieldname, fileStream, info) => {
    const { filename, mimeType } = info;

    if (!ALLOWED_TYPES.has(mimeType)) {
      fileStream.resume(); // drain the stream
      return res.status(400).json({ error: "Unsupported file type" });
    }

    fileMimeType = mimeType;
    fileExtension = filename.split(".").pop().replace(/[^a-zA-Z0-9]/g, "");
    const key = `uploads/${randomUUID()}.${fileExtension}`;

    fileStream.on("limit", () => {
      limitExceeded = true;
      fileStream.destroy();
    });

    const managed = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: fileMimeType,
      },
    });

    uploadPromise = managed.done().then(() => key);
  });

  bb.on("finish", async () => {
    if (limitExceeded) {
      return res.status(413).json({ error: `File exceeds ${MAX_SIZE / 1024 / 1024} MB limit` });
    }
    if (!uploadPromise) {
      return res.status(400).json({ error: "No file provided" });
    }
    try {
      const key = await uploadPromise;
      res.json({ key });
    } catch (err) {
      next(err);
    }
  });

  bb.on("error", next);

  req.pipe(bb);
});

export default router;
