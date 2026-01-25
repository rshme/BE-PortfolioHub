import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { CloudinaryResponse } from '../common/interfaces/cloudinary-response.interface';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'avatars',
    transformation?: any[],
  ): Promise<CloudinaryResponse> {
    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file format. Please use JPEG, PNG, or WebP',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    const defaultTransformation = [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ];

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: transformation || defaultTransformation,
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(new BadRequestException('File upload failed'));
          } else {
            resolve({
              public_id: result.public_id,
              url: result.url,
              secure_url: result.secure_url,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              created_at: result.created_at,
            });
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload project banner with specific transformation
   */
  async uploadProjectBanner(
    file: Express.Multer.File,
  ): Promise<CloudinaryResponse> {
    const transformation = [
      { width: 1200, height: 630, crop: 'fill', gravity: 'center' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ];
    return this.uploadFile(file, 'projects/banners', transformation);
  }

  /**
   * Upload project image with specific transformation
   */
  async uploadProjectImage(
    file: Express.Multer.File,
  ): Promise<CloudinaryResponse> {
    const transformation = [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ];
    return this.uploadFile(file, 'projects/images', transformation);
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Silently fail if file doesn't exist
      console.error('Failed to delete from Cloudinary:', error);
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\./);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}
