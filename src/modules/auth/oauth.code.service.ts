import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

type CreateCodeParams = {
  userId: string;
};

type OAuthCodePayload = {
  userId: string;
};

@Injectable()
export class OAuthCodeService {
  private readonly keyPrefix = 'oauth:code:';
  private readonly ttlSeconds = 60; // 1분

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: {
      set: (
        key: string,
        value: string,
        mode: 'EX',
        duration: number,
      ) => Promise<unknown>;
      get: (key: string) => Promise<string | null>;
      del: (key: string) => Promise<number>;
    },
  ) {}

  private buildKey(code: string) {
    return `${this.keyPrefix}${code}`;
  }

  async createCode({ userId }: CreateCodeParams): Promise<string> {
    const code = randomUUID();

    const payload: OAuthCodePayload = {
      userId,
    };

    await this.redis.set(
      this.buildKey(code),
      JSON.stringify(payload),
      'EX',
      this.ttlSeconds,
    );

    return code;
  }

  /**
   * TODO:
   * 현재 구현은 Redis에서 GET 후 DEL을 수행하는 방식이다.
   * 이 방식은 완전한 원자적(atomic) 처리가 아니기 때문에
   * 매우 드물지만 동시에 두 요청이 들어올 경우 race condition 가능성이 있다.
   *
   * 로컬 개발 및 초기 서비스 단계에서는 충분히 동작하지만,
   * 추후 보안 및 동시성 안정성을 위해 아래 방식으로 개선할 수 있다.
   *
   * 1. Redis GETDEL 명령어 사용
   * 2. Lua Script로 get+delete 원자 처리
   * 3. Redis transaction (MULTI / EXEC)
   *
   * 현재는 구현 단순성을 위해 GET → DEL 방식으로 유지한다.
   */
  async consumeCode(code: string): Promise<OAuthCodePayload | null> {
    const key = this.buildKey(code);

    const raw = await this.redis.get(key);
    if (!raw) {
      return null;
    }

    await this.redis.del(key);

    try {
      return JSON.parse(raw) as OAuthCodePayload;
    } catch {
      return null;
    }
  }
}
