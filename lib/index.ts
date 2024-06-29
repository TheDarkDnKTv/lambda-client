import axios, { HttpStatusCode } from 'axios'
import { API, Request, Response } from 'lambda-api'
import {
    ApiClient, AxiosProvider,
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

export function defineHandler<T extends Endpoint>(definition: T, controller: Controller<T['_type']>): ControllerMetadata<T['_type']>;
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

export function registerHandlers<T extends Record<string, ControllerMetadata>>(api: API, handlers: T) {
    for (const key of Object.keys(handlers)) {
        const controller = handlers[key] as ControllerMetadata
        const method = controller.endpoint.method;
        api[method](controller.endpoint.path, controller.handler)
    }
}

export function createApiClient<T extends Record<string, Endpoint>>(baseURL: string, endpoints: T): ApiClient<T>;
export function createApiClient<T extends Record<string, Endpoint>>(baseURL: string, endpoints: T, axiosProvider: AxiosProvider = axios.create): ApiClient<T> {
    const client: ApiClient<T> = {} as ApiClient<T>;
    const http = axiosProvider({
        baseURL,
        validateStatus: () => true
    });

    for (const key of Object.keys(endpoints)) {
        const endpoint = endpoints[key]
        const lowerCaseKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof ApiClient<T>;
        client[lowerCaseKey] = createApiMethod(http, endpoint);
    }

    return client;
}
