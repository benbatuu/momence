import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'momence-media';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export type StorageFolder = 'videos' | 'classes' | 'thumbnails' | 'avatars';

export class StorageService {
  /**
   * Cloudflare R2'ye doğrudan istemci tarafından yükleme yapmak için Presigned Upload URL üretir.
   * Dosya yolu formatı: {studioId}/{folder}/{filename}
   */
  static async getPresignedUploadUrl(
    studioId: string,
    folder: StorageFolder,
    fileName: string,
    contentType: string
  ) {
    const fileExtension = fileName.split('.').pop();
    const sanitizedFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    
    // Anlamlı klasör yapısı: studioId/folder/sanitizedFileName
    const key = `${studioId}/${folder}/${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // 15 dakika geçerli presigned URL
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    const publicUrl = `${R2_PUBLIC_DOMAIN}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
    };
  }

  /**
   * R2 üzerindeki bir dosyayı siler.
   */
  static async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }
}