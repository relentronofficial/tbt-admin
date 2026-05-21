import type { FastifyReply, FastifyRequest } from 'fastify';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env.js';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY || '',
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_KEY || '',
  },
});

export async function getPresignedUrlHandler(request: FastifyRequest, reply: FastifyReply) {
  const { filename, contentType, bucket, pathPrefix } = request.body as { filename: string; contentType: string; bucket?: string; pathPrefix?: string };
  
  if (!filename || !contentType) {
    return reply.status(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Filename and contentType are required' } });
  }

  const targetBucket = bucket || 'avatars';
  const targetPrefix = pathPrefix || 'admins/photos';

  // Use Supabase Storage if Cloudflare R2 is not configured
  if (!env.CLOUDFLARE_R2_ACCESS_KEY || !env.CLOUDFLARE_R2_SECRET_KEY) {
    const key = `${targetPrefix}/${Date.now()}-${filename}`;
    
    try {
      const { data, error } = await (request.server as any).supabase.storage
        .from(targetBucket)
        .createSignedUploadUrl(key);

      if (error) {
        // If bucket doesn't exist, try to create it and retry once
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
           // Decide if bucket should be public based on name
           const isPublic = targetBucket !== 'kyc-documents';
           await (request.server as any).supabase.storage.createBucket(targetBucket, { public: isPublic });
           const { data: retryData, error: retryError } = await (request.server as any).supabase.storage
             .from(targetBucket)
             .createSignedUploadUrl(key);
           
           if (retryError) throw retryError;
           
           const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${targetBucket}/${key}`;
           return reply.send({ success: true, data: { uploadUrl: retryData.signedUrl, publicUrl } });
        }
        throw error;
      }

      const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${targetBucket}/${key}`;
      return reply.send({ success: true, data: { uploadUrl: data.signedUrl, publicUrl } });
    } catch (err: any) {
      request.server.log.error(err);
      return reply.status(500).send({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message || 'Failed to generate upload URL' } });
    }
  }

  const key = `${targetPrefix}/${Date.now()}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `https://${env.CLOUDFLARE_R2_BUCKET_NAME}.r2.dev/${key}`; 
    
    return reply.send({ 
      success: true, 
      data: { uploadUrl, publicUrl } 
    });
  } catch (err: any) {
    request.server.log.error(err);
    return reply.status(500).send({ success: false, error: { code: 'UPLOAD_ERROR', message: 'Failed to generate R2 upload URL' } });
  }
}
