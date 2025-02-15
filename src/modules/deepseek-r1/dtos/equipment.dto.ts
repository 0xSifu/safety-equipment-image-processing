import { IsNotEmpty, IsString, IsBoolean, IsNumber, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EquipmentStatus {
  @ApiProperty({ description: 'Whether the equipment is being worn' })
  @IsBoolean()
  @IsNotEmpty()
  worn: boolean;

  @ApiProperty({ description: 'Color of the equipment', required: false })
  @IsString()
  @IsOptional()
  color?: string;
}

export class PersonEquipment {
  @ApiProperty({ description: 'Unique identifier for the person' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Description of the person' })
  @IsString()
  @IsNotEmpty()
  desc: string;

  @ApiProperty({ description: 'Helmet equipment status' })
  @IsNotEmpty()
  helm: EquipmentStatus;

  @ApiProperty({ description: 'Uniform equipment status' })
  @IsNotEmpty()
  uniform: EquipmentStatus;

  @ApiProperty({ description: 'Gloves equipment status' })
  @IsNotEmpty()
  gloves: EquipmentStatus;

  @ApiProperty({ description: 'Boots equipment status' })
  @IsNotEmpty()
  boots: EquipmentStatus;
}

export class ImageAnalysisResponseDto {
  @ApiProperty({ 
    description: 'Array of analyzed people and their equipment',
    type: [PersonEquipment]
  })
  @IsArray()
  @IsNotEmpty()
  results: PersonEquipment[];

  @ApiProperty({ description: 'Total number of people detected in the image' })
  @IsNumber()
  @IsNotEmpty()
  totalPeople: number;
}

export class AnalyzeImageDto {
  @ApiProperty({ 
    description: 'URL of the image to analyze',
    example: 'https://example.com/image.jpg'
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}