import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CreateAxiosDefaults, HttpStatusCode } from 'axios'
import {
    ApiClient,
    ApiClientConfig,
    ApiError,
    ApiMethod,
    ApiMethodArguments,
    ApiMethodResponse,
    Endpoint,
    EndpointDefinition,
    HttpMethod,
    RecursiveRecord,
} from './types.js'

export function createApiMethod<T extends Endpoint = Endpoint>(
    axios: AxiosInstance,
    endpoint: T,
    clientConfig: ApiClientConfig
): ApiMethod<T['_type']> {
    return (async (data?: ApiMethodArguments<typeof endpoint._type>) => {
        if (!data) {
            data = {} as ApiMethodArguments<typeof endpoint._type>
        }

        const method = endpoint.method
        const path = fillPathVariables(endpoint.path, data.params)
        const config = clientConfig.prepareRequestConfig(endpoint, {
            params: data.query,
        })

        let response
        switch (method) {
            case HttpMethod.GET: {
                response = await axios.get(path, config)
                break
            }
            case HttpMethod.DELETE: {
                response = await axios.delete(path, {
                    ...config,
                    data: data.body,
                })
                break
            }
            default: {
                response = await axios[method](path, data.body, config)
            }
        }

        if (clientConfig.isResponseInvalid(response)) {
            return [
                null,
                {
                    code: response.status,
                    message: response.statusText,
                    headers: response.headers,
                    body: response.data,
                } satisfies ApiError,
            ]
        }

        return [response.data, null] satisfies ApiMethodResponse<T['_type']['response']>
    }) as ApiMethod<T['_type']>
}

export function defineEndpoint<Def extends EndpointDefinition>(method: HttpMethod, path: string): Endpoint<Def> {
    return {
        method,
        path,
        _type: {} as unknown as Def,
    }
}

export function defineCustomEndpoint<T extends Endpoint<U>, U extends EndpointDefinition = EndpointDefinition>(
    method: HttpMethod,
    path: string,
    extras: Omit<T, keyof Endpoint>
): T {
    return {
        ...extras,
        method,
        path,
        _type: {} as unknown as U,
    } as T
}

export class DefaultClientConfig implements ApiClientConfig {
    createAxios(config: CreateAxiosDefaults): AxiosInstance {
        return axios.create(config)
    }

    prepareRequestConfig(endpoint: Endpoint, initialConfig: AxiosRequestConfig): AxiosRequestConfig {
        return initialConfig
    }

    isResponseInvalid(response: AxiosResponse): boolean {
        return response.status >= HttpStatusCode.BadRequest
    }
}

export function createApiClient<T extends RecursiveRecord<Endpoint>>(
    baseURL: string,
    endpoints: T,
    clientConfig?: ApiClientConfig
): ApiClient<T> {
    if (!clientConfig) {
        clientConfig = new DefaultClientConfig()
    }

    const http = clientConfig.createAxios({
        baseURL,
        validateStatus: () => true,
    })

    function convertToApi(value: Record<string, unknown>): RecursiveRecord<ApiMethod<EndpointDefinition>> {
        const obj: RecursiveRecord<ApiMethod<EndpointDefinition>> = {}
        for (const key of Object.keys(value)) {
            const endpoint = value[key]
            if (isEndpoint(endpoint)) {
                obj[key] = createApiMethod(http, endpoint, clientConfig!)
            } else if (typeof endpoint === 'object' && endpoint !== null) {
                obj[key] = convertToApi(endpoint as Record<string, unknown>)
            }
            // skip non-endpoint types
        }

        return obj
    }

    return convertToApi(endpoints) as ApiClient<T>
}

export function lowerCased(value: string): string {
    return value && value.length > 1 ? value.charAt(0).toLowerCase() + value.slice(1) : ''
}

function fillPathVariables(uri: string, params: Record<string, unknown>): string {
    const regex = new RegExp('(:[\\w\\-_]+)+', 'gus')
    let result = ''
    let idx = 0

    do {
        const exec = regex.exec(uri)
        if (exec === null) {
            break
        }

        result += uri.slice(idx, exec.index)
        idx = exec.index

        const paramName = uri.slice(idx + 1, (idx += +exec[1].length))
        result += params[paramName] || ''

        // eslint-disable-next-line no-constant-condition
    } while (true)

    if (idx < uri.length) {
        result += uri.slice(idx)
    }

    return result
}

function isEndpoint(value: unknown): value is Endpoint {
    return (
        typeof value === 'object' &&
        value !== null &&
        Object.prototype.hasOwnProperty.call(value, 'method') &&
        Object.prototype.hasOwnProperty.call(value, 'path') &&
        Object.prototype.hasOwnProperty.call(value, '_type')
    )
}
