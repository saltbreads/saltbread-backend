export type AuthPrincipal = {
  userId: string;
  sessionId?: string;
  provider?: 'GOOGLE' | 'KAKAO' | 'NAVER';
  roles?: string[];
};
