import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  IOpenAiTagSuggestionService,
  SuggestReviewTagsInput,
  SuggestReviewTagsOutput,
} from './interface/openai-tag-suggestion.service.interface';

type Env = {
  OPENAI_API_KEY: string;
};

@Injectable()
export class OpenAiTagSuggestionService implements IOpenAiTagSuggestionService {
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService<Env, true>) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');

    this.client = new OpenAI({
      apiKey,
    });
  }

  async suggestReviewTags(
    input: SuggestReviewTagsInput,
  ): Promise<SuggestReviewTagsOutput> {
    const { content, tags, maxTags } = input;

    try {
      const response = await this.client.responses.create({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: [
                  '너는 리뷰 태그 추천기다.',
                  '반드시 제공된 태그 후보 안에서만 선택해야 한다.',
                  '리뷰 내용에 명확한 근거가 있는 태그만 고른다.',
                  '추측하지 않는다.',
                  `최대 ${maxTags}개까지만 선택한다.`,
                  '응답은 반드시 JSON 형식이어야 한다.',
                  '형식: {"tags": ["태그1", "태그2"]}',
                ].join('\n'),
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  `리뷰 내용: ${content}`,
                  '',
                  `태그 후보: ${tags.join(', ')}`,
                ].join('\n'),
              },
            ],
          },
        ],
      });

      const text = response.output_text?.trim();

      if (!text) {
        throw new InternalServerErrorException('OpenAI 응답이 비어 있습니다.');
      }

      const parsed = JSON.parse(text) as SuggestReviewTagsOutput;

      return {
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };
    } catch (error) {
      console.error(
        '[OpenAiTagSuggestionService.suggestReviewTags] failed',
        error,
      );

      throw new InternalServerErrorException(
        'OpenAI 태그 추천 호출에 실패했습니다.',
      );
    }
  }
}
