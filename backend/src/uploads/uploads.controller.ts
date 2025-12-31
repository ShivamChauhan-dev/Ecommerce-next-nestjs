import {
    Controller,
    Post,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    /**
     * Upload a single image
     * POST /uploads/image
     */
    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body('folder') folder?: string,
    ) {
        const result = await this.uploadsService.uploadImage(
            file,
            folder || 'products',
        );
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Upload multiple images (max 10)
     * POST /uploads/images
     */
    @Post('images')
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadMultipleImages(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folder') folder?: string,
    ) {
        const results = await this.uploadsService.uploadMultipleImages(
            files,
            folder || 'products',
        );
        return {
            success: true,
            data: results,
            count: results.length,
        };
    }

    /**
     * Delete an image by public ID
     * DELETE /uploads/:publicId
     */
    @Delete(':publicId')
    async deleteImage(@Param('publicId') publicId: string) {
        // Cloudinary public IDs can contain slashes (folder/image)
        // URL decode the public ID
        const decodedPublicId = decodeURIComponent(publicId);
        const result = await this.uploadsService.deleteImage(decodedPublicId);
        return {
            success: result.success,
            message: result.success
                ? 'Image deleted successfully'
                : 'Failed to delete image',
        };
    }

    /**
     * Delete multiple images
     * POST /uploads/delete-multiple
     */
    @Post('delete-multiple')
    async deleteMultipleImages(@Body('publicIds') publicIds: string[]) {
        const result = await this.uploadsService.deleteMultipleImages(publicIds);
        return {
            success: true,
            deleted: result.deleted,
            count: result.deleted.length,
        };
    }
}
