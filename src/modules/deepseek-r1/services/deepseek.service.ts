import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/services/prisma.service';
import { ImageAnalysisResponseDto, PersonEquipment } from '../dtos/equipment.dto';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import axios from 'axios';

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

      const formattedResponse = await this.formatPPEResponse(objectResult, tagResult, file.buffer);
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

  private async formatPPEResponse(objectResult: any, tagResult: any, imageBuffer: Buffer): Promise<PersonEquipment[]> {
    const people: PersonEquipment[] = [];
    const objects = objectResult.objects || [];
    const tags = tagResult.tags || [];
    const colors = objectResult.color?.dominantColors || [];
    
    // Convert tags to lowercase for easier matching
    const tagNames = tags.map(t => t.name.toLowerCase());
    
    let personCount = 0;

    // Updated keywords for gloves
    const glovesKeywords = [
      'gloves', 'safety gloves', 'hand protection', 'work gloves', 
      'protective gloves', 'hand cover', 'industrial gloves', 
      'safety hand wear', 'hand equipment', 'hand gear', 
      'black gloves', 'dark gloves', 'work gloves', 
      'blue gloves', 'orange gloves', 'yellow gloves', 
      'hand accessory', 'handguard', 'hand safety', 'palm cover' 
    ];

    // Updated colors for gloves
    const gloveColors = [
      'black', 'gray', 'blue', 'orange', 'green', 'red', 
      'purple', 'white', '#D8DDE7', '#E5E5E5', 'silver', 'dark gray'
    ];

    // Get Custom Vision predictions
    const customVisionPredictions = await this.getCustomVisionPredictions(imageBuffer);

    // Find people
    objects.forEach(obj => {
      if (obj.object.toLowerCase() === 'person') {
        personCount++;
        
        // Check for PPE in both objects, tags, and Custom Vision predictions
        const equipment = {
          id: personCount.toString(),
          desc: `person ${personCount}`,
          helm: this.getEquipmentResult(
            this.checkForEquipment(['helmet', 'hard hat', 'safety helmet', 'yellow helmet', 'construction helmet', 'protective headgear'], objects, tagNames),
            this.getCustomVisionResult('helm', customVisionPredictions)
          ),
          uniform: this.getEquipmentResult(
            this.checkForEquipment(['uniform', 'jacket', 'safety vest', 'workwear', 'coverall', 'overall', 'jumpsuit', 'work shirt', 'long sleeve', 'protective clothing', 'safety suit', 'work uniform', 'industrial uniform', 'work clothes', 'safety harness', 'harness', 'fall protection', 'blue uniform', 'orange vest', 'reflective vest', 'yellow vest', 'green vest', 'red vest', 'purple vest', 'brown vest', 'gray vest', 'black vest', 'white vest'], objects, tagNames) || 
            this.checkForColors(['blue', 'orange', 'yellow', 'green', 'red', 'purple', 'brown', 'gray', 'black', 'white'], colors),
            this.getCustomVisionResult('uniform', customVisionPredictions)
          ),
          vest: this.getEquipmentResult(
            this.checkForEquipment(['vest', 'safety vest', 'reflective vest', 'orange vest', 'yellow vest', 'green vest', 'red vest', 'purple vest', 'brown vest', 'gray vest', 'black vest', 'white vest'], objects, tagNames),
            this.getCustomVisionResult('vest', customVisionPredictions)
          ),
          gloves: this.getEquipmentResult(
            this.checkForEquipment(glovesKeywords, objects, tagNames) || this.checkForColors(gloveColors, colors),
            this.getCustomVisionResult('gloves', customVisionPredictions)
          ),
          boots: this.getEquipmentResult(
            this.checkForEquipment(['boots', 'safety boots', 'work boots', 'footwear', 'protective footwear', 'brown boots', 'construction boots'], objects, tagNames) || 
            this.checkForColors(['brown', 'black', 'blue', 'orange', 'green', 'red', 'purple', 'white'], colors),
            this.getCustomVisionResult('boots', customVisionPredictions)
          )
        };

        console.log('Computer Vision Objects:', objects);
        console.log('Computer Vision Tags:', tagNames);
        console.log('Computer Vision Colors:', colors);
        console.log('Custom Vision Predictions:', customVisionPredictions);
        console.log('Helm - Computer Vision Result:', this.checkForEquipment(['helmet', 'hard hat', 'safety helmet', 'yellow helmet', 'construction helmet', 'protective headgear'], objects, tagNames));
        console.log('Helm - Custom Vision Probabilities:', customVisionPredictions.predictions.filter(p => p.tagName.toLowerCase() === 'helm').map(p => ({ tagName: p.tagName, probability: p.probability })));
        console.log('Uniform - Computer Vision Result:', this.checkForEquipment(['uniform', 'jacket', 'safety vest', 'workwear', 'coverall', 'overall', 'jumpsuit', 'work shirt', 'long sleeve', 'protective clothing', 'safety suit', 'work uniform', 'industrial uniform', 'work clothes', 'safety harness', 'harness', 'fall protection', 'blue uniform', 'orange vest', 'reflective vest', 'yellow vest', 'green vest', 'red vest', 'purple vest', 'brown vest', 'gray vest', 'black vest', 'white vest'], objects, tagNames) || this.checkForColors(['blue', 'orange', 'yellow', 'green', 'red', 'purple', 'brown', 'gray', 'black', 'white'], colors));
        console.log('Uniform - Custom Vision Probabilities:', customVisionPredictions.predictions.filter(p => p.tagName.toLowerCase() === 'uniform').map(p => ({ tagName: p.tagName, probability: p.probability })));
        console.log('Vest - Computer Vision Result:', this.checkForEquipment(['vest', 'safety vest', 'reflective vest', 'orange vest', 'yellow vest', 'green vest', 'red vest', 'purple vest', 'brown vest', 'gray vest', 'black vest', 'white vest'], objects, tagNames));
        console.log('Vest - Custom Vision Probabilities:', customVisionPredictions.predictions.filter(p => p.tagName.toLowerCase() === 'vest').map(p => ({ tagName: p.tagName, probability: p.probability })));
        console.log('Gloves - Computer Vision Result:', this.checkForEquipment(glovesKeywords, objects, tagNames) || this.checkForColors(gloveColors, colors));
        console.log('Gloves - Custom Vision Probabilities:', customVisionPredictions.predictions.filter(p => p.tagName.toLowerCase() === 'gloves').map(p => ({ tagName: p.tagName, probability: p.probability })));
        console.log('Boots - Computer Vision Result:', this.checkForEquipment(['boots', 'safety boots', 'work boots', 'footwear', 'protective footwear', 'brown boots', 'construction boots'], objects, tagNames) || this.checkForColors(['brown', 'black', 'blue', 'orange', 'green', 'red', 'purple', 'white'], colors));
        console.log('Boots - Custom Vision Probabilities:', customVisionPredictions.predictions.filter(p => p.tagName.toLowerCase() === 'boots').map(p => ({ tagName: p.tagName, probability: p.probability })));

        people.push(equipment as PersonEquipment);
      }
    });

    return people;
  }

  private checkForEquipment(keywords: string[], objects: any[], tags: string[]): boolean {
    // Lower the confidence threshold for objects
    const inObjects = objects.some(obj => 
      keywords.includes(obj.object.toLowerCase()) && 
      (obj.confidence || 0) > 0.6 // Adjusted confidence threshold
    );
    
    // Check in tags
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

  private async getCustomVisionPredictions(imageBuffer: Buffer): Promise<any> {
    const url = 'https://eudoxcustomvision-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/24f6c7b4-b834-4cc5-b613-e26b8604b63e/detect/iterations/Iteration2/image';
    const headers = {
      'Prediction-Key': '7VcMWiMXZ2fxdyYntPP3r9pwj83EHHkGyd9IwqEow9Ae3Dxp2Bm7JQQJ99BBACYeBjFXJ3w3AAAIACOGH5Yl',
      'Content-Type': 'application/octet-stream'
    };

    try {
      const response = await axios.post(url, imageBuffer, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting Custom Vision predictions: ${error.message}`);
      throw error;
    }
  }

  private getEquipmentResult(computerVisionResult: boolean, customVisionResult: any): { worn: boolean, probability?: number, boundingBox?: any } {
    const threshold = 0.6;
    const highConfidenceThreshold = 0.99;
    
    // Get all probabilities for this equipment
    const allProbabilities = customVisionResult.allProbabilities || [];
    
    console.log('All Probabilities:', allProbabilities);
    console.log('Computer Vision Result:', computerVisionResult);
    
    // Check if there's any probability above highConfidenceThreshold
    const hasHighConfidenceDetection = allProbabilities.some(prob => prob >= highConfidenceThreshold);
    console.log('Has High Confidence Detection:', hasHighConfidenceDetection);
    
    if (hasHighConfidenceDetection) {
      // If we have a very high confidence detection, bypass averaging
      const highestProbability = Math.max(...allProbabilities);
      console.log('Highest Probability:', highestProbability);
      return { 
        worn: true, 
        probability: highestProbability, 
        boundingBox: customVisionResult.boundingBox 
      };
    } else {
      // Calculate average probability if no high confidence detection
      const averageProbability = allProbabilities.length > 0
        ? allProbabilities.reduce((sum, prob) => sum + prob, 0) / allProbabilities.length
        : 0;
      
      console.log('Average Probability:', averageProbability);
      
      // Use regular threshold with average probability
      if (computerVisionResult && averageProbability >= threshold) {
        return { worn: true, probability: averageProbability, boundingBox: customVisionResult.boundingBox };
      } else if (!computerVisionResult && averageProbability >= threshold) {
        return { worn: true, probability: averageProbability, boundingBox: customVisionResult.boundingBox };
      } else {
        return { worn: false, probability: averageProbability, boundingBox: customVisionResult.boundingBox };
      }
    }
  }

  private getCustomVisionResult(tagName: string, predictions: any): any {
    const matchingPredictions = predictions.predictions.filter(p => 
      p.tagName.toLowerCase() === tagName.toLowerCase()
    );
    
    if (matchingPredictions.length > 0) {
      // Extract all probabilities for this tag
      const allProbabilities = matchingPredictions.map(p => p.probability);
      
      // Get the boundingBox from the prediction with highest probability
      const highestProbPrediction = matchingPredictions.reduce((max, pred) => 
        pred.probability > max.probability ? pred : max, matchingPredictions[0]
      );

      console.log(`${tagName} - All Probabilities:`, allProbabilities);
      
      return {
        probability: highestProbPrediction.probability,
        boundingBox: highestProbPrediction.boundingBox,
        allProbabilities: allProbabilities  // This was missing before
      };
    }
    
    return { 
      probability: 0, 
      boundingBox: null, 
      allProbabilities: [] 
    };
  }
}