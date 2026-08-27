import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

/**
 * Storage Service
 * Abstracts the cloud storage provider (Oracle Cloud Object Storage via S3 API).
 */
class StorageService {
  constructor() {
    // We use the S3-compatible API provided by Oracle Cloud Infrastructure (OCI)
    const ociNamespace = process.env.OCI_NAMESPACE;
    const ociRegion = process.env.OCI_REGION || "us-ashburn-1";
    
    // Fallback to AWS env vars to maintain backward compatibility during migration
    const accessKeyId = process.env.OCI_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.OCI_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    this.bucketName = process.env.OCI_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "projectforge-bucket";

    // Standard S3 configuration or OCI endpoint
    const config = {
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      // Important: OCI Object Storage uses path-style addressing for S3 compatibility
      forcePathStyle: true,
    };

    if (ociNamespace) {
      // Use OCI S3-compatible endpoint
      config.endpoint = `https://${ociNamespace}.compat.objectstorage.${ociRegion}.oraclecloud.com`;
      config.region = ociRegion;
    } else {
      // Fallback to standard AWS S3 endpoint
      config.region = process.env.AWS_REGION || "us-east-1";
    }

    this.s3Client = new S3Client(config);
  }

  /**
   * Returns a multer middleware configured to stream uploads directly to the object storage.
   */
  getMulterMiddleware() {
    return multer({
      storage: multerS3({
        s3: this.s3Client,
        bucket: this.bucketName,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
          // Append original extension and avoid collisions with timestamp
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
          cb(null, `projectforge/${uniqueSuffix}-${name}${ext}`);
        },
      }),
    });
  }
}

export const storage = new StorageService();
