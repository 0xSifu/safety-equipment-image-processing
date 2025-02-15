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
        this.logger.log(`Received analysis request for image: ${file.originalname}`);
        return this.deepseekService.analyzeImage(file);
    }
}