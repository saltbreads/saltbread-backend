import { IsString, MinLength, MaxLength } from 'class-validator';

export class SuggestReviewTagsDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  content: string;
}
