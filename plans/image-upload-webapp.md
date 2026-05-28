# Plan: Image-Upload-Webapp (Lokal → AWS S3)

## Context

Das Projekt ist ein leeres React/Node.js-Projekt. Ziel ist eine Webapp, mit der Bilder vom lokalen Dateisystem direkt auf AWS S3 hochgeladen werden können. Das Backend generiert Presigned URLs (AWS-Credentials bleiben serverseitig), der Browser lädt Dateien direkt zu S3 hoch.

**Sicherheitsprinzip:** AWS-Credentials kommen nie in den Browser. Nur der Node.js-Backend kennt sie.

---

## Architektur (Two-Step Upload)

```
Browser → POST /api/upload/presign → Express (signiert mit echten Creds) → { uploadUrl, key }
Browser → PUT uploadUrl direkt → S3 (kein Backend beteiligt)
```

---

## Projektstruktur

```
d:\HiFly\website_aws\
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileDropzone.jsx       ← Drag&Drop + click-to-browse
│   │   │   ├── UploadQueue.jsx        ← Liste aller Uploads
│   │   │   ├── UploadItem.jsx         ← Einzelne Datei (Fortschritt, Status)
│   │   │   └── StatusBadge.jsx        ← DaisyUI badge (idle/uploading/success/error)
│   │   ├── hooks/
│   │   │   └── useUpload.js           ← State-Management für Uploads
│   │   ├── services/
│   │   │   └── uploadService.js       ← getPresignedUrl() + uploadToS3()
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                  ← @tailwind directives
│   ├── .env                           ← VITE_API_BASE_URL=/api
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js                 ← Proxy /api → localhost:4000
│   ├── tailwind.config.js             ← DaisyUI plugin
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── s3.js                  ← S3Client-Instanz
│   │   ├── routes/
│   │   │   └── upload.js              ← POST /presign (presigned URL generieren)
│   │   ├── middleware/
│   │   │   ├── validateRequest.js
│   │   │   └── errorHandler.js
│   │   └── server.js
│   ├── .env                           ← AWS-Keys (nie committen!)
│   ├── .env.example
│   └── package.json                   ← "type": "module"
│
├── plans/
│   └── image-upload-webapp.md         ← Diese Datei
├── .gitignore
└── CLAUDE.md
```

---

## AWS-Konfiguration (Schritt für Schritt)

### 1. S3 Bucket erstellen

```bash
aws s3api create-bucket \
  --bucket <DEIN-BUCKET-NAME> \
  --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1
```

Public Access blockieren (Standard, muss aktiv bleiben):
```bash
aws s3api put-public-access-block \
  --bucket <DEIN-BUCKET-NAME> \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 2. S3 CORS-Policy

Erlaubt Browser-PUT via Presigned URL. Im AWS Console: S3 → Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Für Produktion `AllowedOrigins` auf die echte Domain setzen, nie `"*"`.

### 3. IAM User mit minimalen Rechten

Nur `s3:PutObject` auf das `uploads/`-Prefix — kein List, Get, Delete:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPutInUploadsPrefix",
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::<DEIN-BUCKET-NAME>/uploads/*"
    }
  ]
}
```

```bash
aws iam create-user --user-name s3-uploader-app
aws iam put-user-policy \
  --user-name s3-uploader-app \
  --policy-name S3UploaderPolicy \
  --policy-document file://iam-policy.json
aws iam create-access-key --user-name s3-uploader-app
# → AccessKeyId + SecretAccessKey kopieren → backend/.env
```

### 4. backend/.env befüllen

```
PORT=4000
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1
S3_BUCKET_NAME=<DEIN-BUCKET-NAME>
ALLOWED_ORIGIN=http://localhost:5173
PRESIGN_EXPIRY_SECONDS=300
```

---

## Frontend-Dependencies

```bash
# in frontend/
npm create vite@latest . -- --template react
npm install axios
npm install -D tailwindcss postcss autoprefixer daisyui
npx tailwindcss init -p
```

## Backend-Dependencies

```bash
# in backend/
npm init -y  # dann "type": "module" hinzufügen
npm install express cors helmet dotenv @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install -D nodemon
```

---

## Wichtige Implementierungsdetails

### Presigned URL Route (`backend/src/routes/upload.js`)

- MIME-Typ-Allowlist: `image/jpeg, image/png, image/gif, image/webp, image/svg+xml`
- Key-Generierung: `uploads/${randomUUID()}.${ext}` — Originalname wird verworfen (verhindert Path-Traversal)
- URL läuft nach 5 Minuten ab

### Upload-Service (`frontend/src/services/uploadService.js`)

```js
// Schritt 1: Presigned URL vom Backend holen
getPresignedUrl(filename, contentType) → { uploadUrl, key }

// Schritt 2: Direkt zu S3 PUT mit Axios (wegen onUploadProgress)
uploadToS3(uploadUrl, file, onProgress)
// Content-Type Header MUSS mit dem gesignten Wert übereinstimmen!
```

### Vite Dev-Proxy (`frontend/vite.config.js`)

```js
proxy: { "/api": { target: "http://localhost:4000", changeOrigin: true } }
```

---

## Verifikation

1. Backend starten: `cd backend && npm run dev` → läuft auf Port 4000
2. Frontend starten: `cd frontend && npm run dev` → läuft auf Port 5173
3. Browser öffnen: `http://localhost:5173`
4. Bild via Drag&Drop oder Klick auswählen → "Upload All" → Fortschrittsbalken → grünes "success"-Badge
5. Im AWS Console: S3 → Bucket → `uploads/` Prefix → hochgeladenes Bild prüfen
6. Mit einer nicht erlaubten Datei testen (z.B. .txt) → muss Fehlermeldung zeigen
