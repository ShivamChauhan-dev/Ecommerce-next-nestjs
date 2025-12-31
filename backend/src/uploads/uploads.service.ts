import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadsService {
    constructor(private configService: ConfigService) {
        // Configure Cloudinary
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    /**
     * Upload a single image to Cloudinary
     */
    async uploadImage(
        file: Express.Multer.File,
        folder = 'products',
    ): Promise<{ url: string; publicId: string }> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Validate file type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new BadRequestException(
                'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException('File size exceeds 5MB limit');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
                        { quality: 'auto:good' }, // Auto optimize quality
                        { fetch_format: 'auto' }, // Auto format (webp when supported)
                    ],
                },
                (error, result: UploadApiResponse | undefined) => {
                    if (error) {
                        reject(new BadRequestException(`Upload failed: ${error.message}`));
                    } else if (result) {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    }
                },
            );

            // Convert buffer to stream and pipe to Cloudinary
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    /**
     * Upload multiple images
     */
    async uploadMultipleImages(
        files: Express.Multer.File[],
        folder = 'products',
    ): Promise<{ url: string; publicId: string }[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        if (files.length > 10) {
            throw new BadRequestException('Maximum 10 files allowed per upload');
        }

        const uploadPromises = files.map((file) => this.uploadImage(file, folder));
        return Promise.all(uploadPromises);
    }

    /**
     * Delete an image from Cloudinary
     */
    async deleteImage(publicId: string): Promise<{ success: boolean }> {
        if (!publicId) {
            throw new BadRequestException('Public ID is required');
        }

        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return { success: result.result === 'ok' };
        } catch (error) {
            throw new BadRequestException(`Delete failed: ${error.message}`);
        }
    }

    /**
     * Delete multiple images
     */
    async deleteMultipleImages(
        publicIds: string[],
    ): Promise<{ success: boolean; deleted: string[] }> {
        if (!publicIds || publicIds.length === 0) {
            throw new BadRequestException('Public IDs are required');
        }

        try {
            const result = await cloudinary.api.delete_resources(publicIds);
            const deleted = Object.keys(result.deleted).filter(
                (key) => result.deleted[key] === 'deleted',
            );
            return { success: true, deleted };
        } catch (error) {
            throw new BadRequestException(`Delete failed: ${error.message}`);
        }
    }

    /**
     * Generate a thumbnail URL from existing image
     */
    getOptimizedUrl(
        publicId: string,
        options: { width?: number; height?: number } = {},
    ): string {
        const { width = 400, height = 400 } = options;
        return cloudinary.url(publicId, {
            width,
            height,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto',
        });
    }
}
