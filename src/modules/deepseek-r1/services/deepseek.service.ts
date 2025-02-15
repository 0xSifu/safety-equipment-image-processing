import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/services/prisma.service';
import { ImageAnalysisResponseDto, PersonEquipment } from '../dtos/equipment.dto';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

@Injectable()
export class DeepseekService {
  private readonly logger = new Logger(DeepseekService.name);
  private visionClient: ComputerVisionClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const credentials = new ApiKeyCredentials({ 
      inHeader: { 
        'Ocp-Apim-Subscription-Key': this.configService.get('AZURE_VISION_KEY') 
      } 
    });
    
    this.visionClient = new ComputerVisionClient(
      credentials,
      this.configService.get('AZURE_VISION_ENDPOINT')
    );
  }

  async analyzeImage(file: Express.Multer.File): Promise<ImageAnalysisResponseDto> {
    try {
      this.logger.log(`Analyzing image: ${file.originalname}`);

      // Get both object detection and tag analysis
      const [objectResult, tagResult] = await Promise.all([
        this.visionClient.analyzeImageInStream(
          file.buffer,
          { 
            visualFeatures: ['Objects', 'Color'],
            details: ['Landmarks']
          }
        ),
        this.visionClient.analyzeImageInStream(
          file.buffer,
          { 
            visualFeatures: ['Tags', 'Description'],
            details: ['Landmarks']
          }
        )
      ]);

      const formattedResponse = this.formatPPEResponse(objectResult, tagResult);
      await this.saveAnalysisResults(file.originalname, formattedResponse);

      return {
        results: formattedResponse,
        totalPeople: formattedResponse.length,
      };
    } catch (error) {
      this.logger.error(`Error analyzing image: ${error.message}`);
      throw error;
    }
  }

  private formatPPEResponse(objectResult: any, tagResult: any): PersonEquipment[] {
    const people: PersonEquipment[] = [];
    const objects = objectResult.objects || [];
    const tags = tagResult.tags || [];
    const colors = objectResult.color?.dominantColors || [];
    
    // Convert tags to lowercase for easier matching
    const tagNames = tags.map(t => t.name.toLowerCase());
    
    let personCount = 0;

    // Find people
    objects.forEach(obj => {
      if (obj.object.toLowerCase() === 'person') {
        personCount++;
        
        // Check for PPE in both objects and tags
        const equipment = {
          id: personCount.toString(),
          desc: `person ${personCount}`,
          helm: { 
            worn: this.checkForEquipment([
              'helmet', 'hard hat', 'safety helmet', 'yellow helmet',
              'construction helmet', 'protective headgear'
            ], objects, tagNames), 
            color: this.detectColor(['yellow', 'blue'], colors)
          },
          uniform: { 
            worn: this.checkForEquipment([
              'vest', 'uniform', 'jacket', 'safety vest', 'workwear',
              'coverall', 'overall', 'jumpsuit', 'work shirt',
              'long sleeve', 'protective clothing', 'safety suit',
              'work uniform', 'industrial uniform', 'work clothes',
              'safety harness', 'harness', 'fall protection',
              'blue uniform', 'orange vest', 'reflective vest'
            ], objects, tagNames) || this.checkForColors(['blue', 'orange', 'yellow', 'green', 'red', 'purple', 'brown', 'gray', 'black', 'white'], colors),
            color: this.detectColor(['blue', 'orange', 'yellow', 'green', 'red', 'purple', 'brown', 'gray', 'black', 'white'], colors)
          },
          gloves: { 
            worn: this.checkForEquipment([
              'gloves', 'safety gloves', 'hand protection', 'work gloves',
              'protective gloves', 'hand cover', 'industrial gloves',
              'safety hand wear', 'hand equipment', 'hand gear',
              'black gloves', 'dark gloves', 'work gloves'
            ], objects, tagNames) || this.checkForColors(['black', 'gray', 'blue', 'orange', 'green', 'red', 'purple', 'white'], colors),
            color: this.detectColor(['black', 'gray', 'blue', 'orange', 'green', 'red', 'purple', 'white'], colors)
          },
          boots: { 
            worn: this.checkForEquipment([
              'boots', 'safety boots', 'work boots', 'footwear',
              'protective footwear', 'brown boots', 'construction boots'
            ], objects, tagNames) || this.checkForColors(['brown', 'black', 'blue', 'orange', 'green', 'red', 'purple', 'white'], colors),
            color: this.detectColor(['brown', 'black', 'blue', 'orange', 'green', 'red', 'purple', 'white'], colors)
          }
        };

        people.push(equipment);
      }
    });

    return people;
  }

  private checkForEquipment(keywords: string[], objects: any[], tags: string[]): boolean {
    // Check in objects with lower confidence threshold
    const inObjects = objects.some(obj => 
      keywords.includes(obj.object.toLowerCase()) && 
      (obj.confidence || 0) > 0.5
    );
    
    // Check in tags (tags are just strings, no confidence)
    const inTags = keywords.some(keyword => 
      tags.includes(keyword.toLowerCase())
    );
    
    return inObjects || inTags;
  }

  private checkForColors(validColors: string[], dominantColors: string[]): boolean {
    return dominantColors.some(color => 
      validColors.includes(color.toLowerCase())
    );
  }

  private detectColor(validColors: string[], dominantColors: string[]): string {
    const foundColor = dominantColors.find(color => 
      validColors.includes(color.toLowerCase())
    );
    
    return foundColor ? foundColor.toLowerCase() : 'unknown';
  }

  private async saveAnalysisResults(
    imageName: string, 
    people: PersonEquipment[]
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        const imageAnalysis = await prisma.imageAnalysis.create({
          data: {
            imageName,
            imageUrl: 'path/to/image',
          },
        });

        for (const person of people) {
          await prisma.person.create({
            data: {
              description: person.desc,
              imageAnalysisId: imageAnalysis.id,
              equipment: {
                create: {
                  hasHelmet: person.helm.worn,
                  helmetColor: person.helm.color,
                  hasJacket: person.uniform.worn,
                  jacketColor: person.uniform.color,
                  hasGloves: person.gloves.worn,
                  glovesColor: person.gloves.color,
                  hasBoots: person.boots.worn,
                  bootsColor: person.boots.color,
                },
              },
            },
          });
        }
      });
    } catch (error) {
      this.logger.error(`Error saving analysis results: ${error.message}`);
      throw error;
    }
  }
}