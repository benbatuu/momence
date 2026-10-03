import type { Studio, User } from '@prisma/client';

export type AppEnv = {
  Variables: {
    studio: Studio;
    studioId: string;
    user: Omit<User, 'password'>;
  };
};