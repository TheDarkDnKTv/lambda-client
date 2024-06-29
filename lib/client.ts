import { AxiosInstance } from 'axios';
import { ApiError, ApiMethod, ApiMethodArguments, ApiMethodResponse, Endpoint, HttpMethod } from './types'

export function createApiMethod<T extends Endpoint = Endpoint>(axios: AxiosInstance, endpoint: T): ApiMethod<T['_type']> {
    return async (data: ApiMethodArguments<typeof endpoint._type>) => {
        // TODO auth
        const method = endpoint.method
        const path = fillPathVariables(endpoint.path, data.params);
        const config = {
            params: data.query
        };

        let response;
        switch (method) {
            case HttpMethod.GET: {
                response = await axios.get(path, config);
                break;
            }
            case HttpMethod.DELETE: {
                response = await axios.delete(path, {
                    ...config,
                    data: data.body
                });
                break;
            }
            default: {
                response = await axios[method](path, data.body, config);
            }
        }

        if (response.status >= 400) {
            return [
                null,
                {
                    code: response.status,
                    message: response.statusText,
                    headers: response.headers,
                    body: response.data
                } satisfies ApiError
            ]
        }

        return [ response.data, null ] satisfies ApiMethodResponse<T['_type']['response']>;
    }
}

function fillPathVariables(uri: string, params: Record<string, unknown>): string {
    const regex = new RegExp('(:[\\w\\-_]+)+', 'gus');
    let result = '';
    let idx = 0;

    do {
        const exec = regex.exec(uri);
        if (exec === null) {
            break;
        }

        result += uri.slice(idx, exec.index);
        idx = exec.index;

        const paramName = uri.slice(idx + 1, idx += + exec[1].length);
        result += params[paramName] || '';

        // eslint-disable-next-line no-constant-condition
    } while(true);

    if (idx < uri.length) {
        result += uri.slice(idx);
    }

    return result;
}