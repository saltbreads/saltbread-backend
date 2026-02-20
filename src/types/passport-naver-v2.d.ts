declare module 'passport-naver-v2' {
  import { Strategy as PassportStrategy } from 'passport';

  export class Strategy extends PassportStrategy {
    constructor(options: {
      clientID: string;
      clientSecret: string;
      callbackURL: string;
    });
  }
}
