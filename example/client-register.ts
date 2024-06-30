import { AxiosRequestConfig } from 'axios'
import { ApiClientConfig, createApiClient, DefaultClientConfig } from '../lib/index.js'
import { MyEndpoint, client } from './common.js'

// Optional, you can leave 3rd argument empty if no processing needed
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

export const api = createApiClient(process.env.API_URL ?? '', client, new MyApiConfig());

async function testGetAll() {
    const [ result, error] = await api.post.getPosts();

    if (!result) {
        console.error(error);
        throw new Error();
    }

    console.info(result)
}

async function testEdit() {
    const [ result, error] = await api.post.updatePost({
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

async function testEndpoint() {
    const response = await api.testEndpoint();
    if (response[1]) {
        console.error('test req error', response[1]);
    }

}

Promise.all([
    testEdit,
    testGetAll,
    testEndpoint
]);