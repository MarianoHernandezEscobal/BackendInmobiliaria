import { Injectable, Inject } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private bucketName: string;

  constructor(
    @Inject(S3Client) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: 'image/jpeg',
    });

    await this.s3Client.send(command);
    return `https://${this.bucketName}.s3.amazonaws.com/${uniqueFileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = fileUrl.replace(`https://${this.bucketName}.s3.amazonaws.com/`, '');
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    return;
  }
}
