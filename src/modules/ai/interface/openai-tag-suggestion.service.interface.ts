export const OPENAI_TAG_SUGGESTION_SERVICE = 'OPENAI_TAG_SUGGESTION_SERVICE';

export type SuggestReviewTagsInput = {
  content: string;
  tags: string[];
  maxTags: number;
};

export type SuggestReviewTagsOutput = {
  tags: string[];
};

export interface IOpenAiTagSuggestionService {
  suggestReviewTags(
    input: SuggestReviewTagsInput,
  ): Promise<SuggestReviewTagsOutput>;
}
