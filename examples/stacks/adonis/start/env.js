import { Env } from '@adonisjs/core/env';
export default await Env.create(new URL('../',import.meta.url),{NODE_ENV:Env.schema.enum(['development','production','test']),PORT:Env.schema.number(),HOST:Env.schema.string(),APP_KEY:Env.schema.string(),LOG_LEVEL:Env.schema.string()});
