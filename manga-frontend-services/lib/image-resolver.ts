export function resolveImageUrl(sourceType: 'mangadex_at_home' | 's3', hash: string, filename: string): string {
  if (sourceType === 'mangadex_at_home') {
    return `https://uploads.mangadex.org/data/${hash}/${filename}`;
  }
  
  if (sourceType === 's3') {
    const s3BucketUrl = process.env.NEXT_PUBLIC_S3_URL || 'https://my-s3-bucket.amazonaws.com';
    return `${s3BucketUrl}/${hash}/${filename}`;
  }

  return filename;
}
