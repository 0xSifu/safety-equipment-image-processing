import { 
    Controller, 
    Post,
    UseInterceptors,
    UploadedFile,
    Logger,
    ParseFilePipe,
    FileTypeValidator,
    MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeepseekService } from '../services/deepseek.service';
import { ImageAnalysisResponseDto } from '../dtos/equipment.dto';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Multer } from 'multer';

@ApiTags('image-analysis')
@Controller({
    version: '1',
    path: '/image-analysis',
})
export class DeepseekController {
    private readonly logger = new Logger(DeepseekController.name);

    constructor(private readonly deepseekService: DeepseekService) {}

    @Post('analyze')
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async analyzeImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
                ],
            }),
        )
        file: Express.Multer.File,
    ): Promise<ImageAnalysisResponseDto> {
        this.logger.log('=== Incoming Image Analysis Request ===');
        this.logger.log('File Details:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            encoding: file.encoding,
            fieldname: file.fieldname
        });

        this.logger.log('Request Headers:', {
            contentType: file.mimetype,
            filename: file.originalname
        });

        this.logger.log('File Buffer Preview:', {
            bufferLength: file.buffer.length,
            bufferPreview: file.buffer.slice(0, 100) // Just preview first 100 bytes
        });

        const result = await this.deepseekService.analyzeImage(file);
        
        this.logger.log('=== Analysis Complete ===');
        this.logger.log('Analysis Result:', result);

        return result;
    }
}