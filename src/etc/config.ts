import * as dotenv from 'dotenv';

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

const config = {
    apiEndpoint: 'https://api.github.com/graphql',
    apiAccessToken: process.env.GITHUB_FETCHER_API_ACCESS_TOKEN || undefined
};

export default config;
