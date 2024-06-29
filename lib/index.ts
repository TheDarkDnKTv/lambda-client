import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CreateAxiosDefaults, HttpStatusCode } from 'axios'
import { API, Request, Response } from 'lambda-api'
import {
    ApiClient, ApiClientConfig,
    BaseRequestContext, ContextProvider,
    Controller,
    ControllerMetadata,
    Endpoint,
    EndpointDefinition, Extract,
    HttpMethod,
} from './types'
import { createApiMethod } from './client'


export class BasicRequestContext<T extends EndpointDefinition = EndpointDefinition> implements BaseRequestContext<T>{

    constructor(
        protected req: Request,
        protected res: Response
    ) {}

    get body(): Extract.Body<T> {
        return this.req.body as Extract.Body<T>
    }

    get params(): Extract.Params<T> {
        return this.req.params as Extract.Params<T>
    }

    get query(): Extract.Query<T> {
        return this.req.query as Extract.Query<T>
    }
}

export class DefaultClientConfig implements ApiClientConfig {

    createAxios(config: CreateAxiosDefaults): AxiosInstance {
        return axios.create(config);
    }

    prepareRequestConfig(endpoint: Endpoint, initialConfig: AxiosRequestConfig): AxiosRequestConfig {
        return initialConfig;
    }

    isResponseInvalid(response: AxiosResponse): boolean {
        return response.status >= HttpStatusCode.BadRequest;
    }
}

export function defineHandler<T extends Endpoint>(
    definition: T,
    controller: Controller<T['_type']>,
    contextProvider: ContextProvider<T['_type']> = (res, req) => new BasicRequestContext<T['_type']>(res, req)
): ControllerMetadata<T['_type']> {
    return {
        endpoint: definition,
        handler: async (req, res) => {
            const context = await contextProvider(req, res);
            const response = await controller(context);

            if (response) {
                res.json(response)
            } else {
                res.sendStatus(HttpStatusCode.Ok)
            }
        },
    }
}

export function defineEndpoint<Def extends EndpointDefinition>(
    method: HttpMethod,
    path: string
): Endpoint<Def> {
    return {
        method,
        path,
        _type: {} as unknown as Def
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
        _type: {} as unknown as U
    } as T
}

/**
 * @param api
 * @param handlers
 * @param endpoints argument is optional, use it in case if you want to validate that defined common types also implemented at serverside to avoid unexpected errors
 */
export function registerHandlers<T extends Record<string, ControllerMetadata>, U extends Record<string, Endpoint> = Record<string, Endpoint>>(api: API, handlers: T, endpoints?: U) {
    if (endpoints) {
        for (const key of Object.keys(endpoints)) {
            if (!Object.prototype.hasOwnProperty.call(handlers, lowerCased(key))) {
                throw new Error(`Defined endpoint < ${key} > has not been found at server-side definition, ApiClient call will cause error!`);
            }
        }
    }

    for (const key of Object.keys(handlers)) {
        const controller = handlers[key] as ControllerMetadata
        const method = controller.endpoint.method;
        api[method](controller.endpoint.path, controller.handler)
    }
}

export function createApiClient<T extends Record<string, Endpoint>>(baseURL: string, endpoints: T, clientConfig?: ApiClientConfig): ApiClient<T> {
    const client = {} as Record<string, unknown>;
    if (!clientConfig) {
        clientConfig = new DefaultClientConfig();
    }

    const http = clientConfig.createAxios({
        baseURL,
        validateStatus: () => true
    });

    for (const key of Object.keys(endpoints)) {
        const endpoint = endpoints[key]
        const lowerCaseKey = lowerCased(key) as keyof ApiClient<T>;
        client[lowerCaseKey] = createApiMethod(http, endpoint, clientConfig);
    }

    return client as ApiClient<T>;
}

function lowerCased(value: string): string {
    return value && value.length > 1 ?
        value.charAt(0).toLowerCase() + value.slice(1) : '';
}