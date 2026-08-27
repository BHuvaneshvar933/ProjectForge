import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

/**
 * Migration Script: AWS S3 -> OCI Object Storage
 * 
 * Copies files from an AWS S3 bucket to an Oracle Cloud Infrastructure (OCI) Object Storage bucket.
 * 
 * IMPORTANT: This script ONLY copies the files. It does NOT delete original files
 * from AWS S3, nor does it rewrite existing MongoDB database URLs.
 */
async function runMigration() {
  console.log("🚀 Starting Storage Migration: AWS S3 -> OCI Object Storage");

  // Validate AWS config
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
    console.error("❌ Missing AWS S3 configuration in .env");
    process.exit(1);
  }

  // Validate OCI config
  if (!process.env.OCI_NAMESPACE || !process.env.OCI_ACCESS_KEY_ID || !process.env.OCI_SECRET_ACCESS_KEY || !process.env.OCI_BUCKET_NAME) {
    console.error("❌ Missing OCI Object Storage configuration in .env");
    process.exit(1);
  }

  const awsBucket = process.env.AWS_S3_BUCKET_NAME;
  const ociBucket = process.env.OCI_BUCKET_NAME;

  // Initialize AWS S3 Client
  const awsS3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  // Initialize OCI S3-compatible Client
  const ociRegion = process.env.OCI_REGION || "us-ashburn-1";
  const ociS3 = new S3Client({
    region: ociRegion,
    endpoint: `https://${process.env.OCI_NAMESPACE}.compat.objectstorage.${ociRegion}.oraclecloud.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.OCI_ACCESS_KEY_ID,
      secretAccessKey: process.env.OCI_SECRET_ACCESS_KEY,
    }
  });

  try {
    console.log(`\n📋 Listing objects in AWS Bucket: ${awsBucket}`);
    let isTruncated = true;
    let continuationToken = undefined;
    let totalCopied = 0;
    let totalFailed = 0;

    while (isTruncated) {
      const listCommand = new ListObjectsV2Command({
        Bucket: awsBucket,
        ContinuationToken: continuationToken,
      });

      const listRes = await awsS3.send(listCommand);
      
      if (!listRes.Contents || listRes.Contents.length === 0) {
        console.log("ℹ️ No objects found in AWS bucket.");
        break;
      }

      for (const object of listRes.Contents) {
        const key = object.Key;
        console.log(`⏳ Copying: ${key}`);

        try {
          // In S3, we can do server-side copies using CopySource if both buckets are in the same provider.
          // Since we are migrating ACROSS providers, we cannot use `CopyObjectCommand` with `CopySource`!
          // We must manually download from AWS and upload to OCI.

          const { GetObjectCommand, PutObjectCommand } = await import("@aws-sdk/client-s3");
          
          const getRes = await awsS3.send(new GetObjectCommand({ Bucket: awsBucket, Key: key }));
          
          // For very large files this buffers everything into memory. For production, @aws-sdk/lib-storage is recommended.
          const bodyBytes = await getRes.Body.transformToByteArray();
          
          await ociS3.send(new PutObjectCommand({
            Bucket: ociBucket,
            Key: key,
            Body: bodyBytes,
            ContentType: getRes.ContentType
          }));
          
          console.log(`✅ Success: ${key}`);
          totalCopied++;
        } catch (copyErr) {
          console.error(`❌ Failed to copy: ${key}`, copyErr);
          totalFailed++;
        }
      }

      isTruncated = listRes.IsTruncated;
      continuationToken = listRes.NextContinuationToken;
    }

    console.log(`\n🎉 Migration completed.`);
    console.log(`Total Copied: ${totalCopied}`);
    console.log(`Total Failed: ${totalFailed}`);
    
  } catch (err) {
    console.error("❌ Migration failed with error:", err);
  }
}

runMigration();
