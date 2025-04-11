import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

export interface FileStorageService {
  saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<SavedFileInfo>;
  getFile(filename: string): Promise<Buffer>;
  deleteFile(filename: string): Promise<boolean>;
}

export interface SavedFileInfo {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

class LocalFileStorage implements FileStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists(): Promise<void> {
    if (!await exists(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<SavedFileInfo> {
    const fileExtension = path.extname(originalFilename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);
    
    await writeFile(filePath, buffer);
    
    return {
      filename: uniqueFilename,
      originalName: originalFilename,
      mimeType: mimeType,
      size: buffer.length
    };
  }

  async getFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, filename);
    return readFile(filePath);
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// For production, you would implement S3 or other cloud storage
// class S3FileStorage implements FileStorageService {
//   private s3Client: S3Client;
//   private bucketName: string;
//
//   constructor() {
//     this.s3Client = new S3Client({
//       region: process.env.AWS_REGION || 'us-east-1',
//       credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
//       },
//     });
//     this.bucketName = process.env.S3_BUCKET_NAME || '';
//   }
//
//   async saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<SavedFileInfo> {
//     const fileExtension = path.extname(originalFilename);
//     const uniqueFilename = `${uuidv4()}${fileExtension}`;
//     
//     await this.s3Client.send(
//       new PutObjectCommand({
//         Bucket: this.bucketName,
//         Key: uniqueFilename,
//         Body: buffer,
//         ContentType: mimeType,
//       })
//     );
//     
//     return {
//       filename: uniqueFilename,
//       originalName: originalFilename,
//       mimeType: mimeType,
//       size: buffer.length
//     };
//   }
//
//   async getFile(filename: string): Promise<Buffer> {
//     const response = await this.s3Client.send(
//       new GetObjectCommand({
//         Bucket: this.bucketName,
//         Key: filename,
//       })
//     );
//     
//     return Buffer.from(await response.Body.transformToByteArray());
//   }
//
//   async deleteFile(filename: string): Promise<boolean> {
//     try {
//       await this.s3Client.send(
//         new DeleteObjectCommand({
//           Bucket: this.bucketName,
//           Key: filename,
//         })
//       );
//       return true;
//     } catch (error) {
//       return false;
//     }
//   }
// }

export const fileStorageService: FileStorageService = new LocalFileStorage();
