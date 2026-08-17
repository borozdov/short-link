import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  PORT: Number(process.env.PORT ?? 4000),

  BASE_LINK_DOMAIN: required('BASE_LINK_DOMAIN'),
  BASE_FALLBACK_URL: process.env.BASE_FALLBACK_URL ?? 'https://borozdov.ru',

  IP_HASH_SALT: required('IP_HASH_SALT'),
};
