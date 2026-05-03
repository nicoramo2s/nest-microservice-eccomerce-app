import { Logger } from '@nestjs/common';
import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  // NODE_ENV: "development" | "production" | "test";
  PORT: number;
}

export const envSchema = joi
  .object({
    // NODE_ENV: joi.string().valid("development", "production", "test").required(),
    PORT: joi.number().required(),
  })
  .unknown(true);

export const { error, value } = envSchema.validate(process.env);

if (error) {
  Logger.error(`Config validation error: ${error.message}`);
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
}