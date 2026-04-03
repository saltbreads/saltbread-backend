import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiTagSuggestionService } from './openai-tag-suggestion.service';
import { OPENAI_TAG_SUGGESTION_SERVICE } from './interface/openai-tag-suggestion.service.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: OPENAI_TAG_SUGGESTION_SERVICE,
      useClass: OpenAiTagSuggestionService,
    },
  ],
  exports: [OPENAI_TAG_SUGGESTION_SERVICE],
})
export class AiModule {}
