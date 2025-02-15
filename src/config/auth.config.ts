import { registerAs } from '@nestjs/config';
import ms from 'ms';

type StringTime = `${number}${'d' | 'h' | 'm' | 's'}`;
const seconds = (s: StringTime) => Math.floor(ms(s) / 1000);

export default registerAs(
  'auth',
  (): Record<string, any> => ({
    accessToken: {
      secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      expirationTime: seconds('1d' as StringTime),
    },
    refreshToken: {
      secret: process.env.REFRESH_TOKEN_SECRET_KEY,
      expirationTime: seconds('7d' as StringTime),
    },
  }),
);