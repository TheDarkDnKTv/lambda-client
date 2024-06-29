import { AxiosRequestConfig } from 'axios'
import { createApiClient, DefaultClientConfig } from '../lib'
import * as endpoints from './common'
import { ApiClientConfig } from '../lib/types'
import { MyEndpoint } from './common'


class MyApiConfig extends DefaultClientConfig implements ApiClientConfig<MyEndpoint>{
    override prepareRequestConfig(endpoint: MyEndpoint, initialConfig: AxiosRequestConfig): AxiosRequestConfig {
        const config = {
            ...initialConfig
        } satisfies AxiosRequestConfig;

        if (endpoint.auth) {
            console.log('auth request check');
            config.headers ??= {};
            config.headers['x-dev-user-id'] = `test_user`;
        }

        return config;
    }
}

const client = createApiClient(process.env.API_URL ?? '', endpoints, new MyApiConfig());
async function testGetAll() {
    const [ result, error] = await client.postsGet();

    if (!result) {
        console.error(error);
        throw new Error();
    }

    console.info(result)
}

async function testEdit() {
    const [ result, error] = await client.postUpdate({
        params: { id: 1 },
        body: {
            name: 'new name',
            content: 'some random text'
        }
    });

    if (!result) {
        console.error(error);
        throw new Error();
    }

    console.info(result.name, result.content)
}

testEdit()
testGetAll()
