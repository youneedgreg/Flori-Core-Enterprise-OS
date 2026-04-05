import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly bucketName =
    process.env.AWS_S3_BUCKET_NAME || 'floricore-labels';
  private readonly isS3Configured =
    !!process.env.AWS_REGION &&
    !!process.env.AWS_ACCESS_KEY_ID &&
    !!process.env.AWS_SECRET_ACCESS_KEY;

  constructor() {
    if (this.isS3Configured) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
      });
      this.logger.log('S3 Storage configured successfully.');
    } else {
      this.logger.warn(
        'S3 credentials not fully provided. Falling back to local storage.',
      );
      const localStorePath = path.join(process.cwd(), 'uploads', 'labels');
      if (!fs.existsSync(localStorePath)) {
        fs.mkdirSync(localStorePath, { recursive: true });
      }
    }
  }

  async uploadFile(
    filename: string,
    buffer: Buffer,
    contentType: string = 'application/pdf',
  ): Promise<string> {
    if (this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: `labels/${filename}`,
          Body: buffer,
          ContentType: contentType,
        });

        await this.s3Client.send(command);

        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/labels/${filename}`;
      } catch (error) {
        this.logger.error(
          `Failed to upload to S3: ${(error as Error).message}`,
          (error as Error).stack,
        );
        throw new Error('Failed to upload file to S3');
      }
    } else {
      // Local fallback
      const localStorePath = path.join(process.cwd(), 'uploads', 'labels');
      const filePath = path.join(localStorePath, filename);

      fs.writeFileSync(filePath, buffer);

      // In a real local setup we'd serve this statically, but for dev this is a stub URL
      return `/uploads/labels/${filename}`;
    }
  }
}
