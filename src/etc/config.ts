import * as dotenv from 'dotenv';

// Load environment variables from .env files in project's root directory
let envConfigPath = `${__dirname}/../../`;
switch (process.env.NODE_ENV) {
    case 'development':
        envConfigPath += '.env.development';
        break;
    case 'test':
        envConfigPath += '.env.test';
        break;
    default:
        envConfigPath += '.env';
        break;
}
dotenv.config({ path: envConfigPath });

/**
 * Common config
 */
const config = {
    apiEndpoint: 'https://api.github.com/graphql',
    apiAccessToken: process.env.GITHUB_FETCHER_API_ACCESS_TOKEN || undefined
};

export default config;
