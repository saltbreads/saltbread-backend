import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsArray,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10) // 최대 10장 제한
  @IsUrl({}, { each: true })
  imageUrls?: string[];
}
