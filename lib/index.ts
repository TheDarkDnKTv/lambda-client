import axios, { HttpStatusCode } from 'axios'
// import * from 'lambda-api';
// import * as server from './test-server'
import { API, HandlerFunction } from 'lambda-api'

interface RequestContext<T> {
    get body(): T extends EndpointDefinition<infer U, unknown, unknown> ? U : never
    get query(): T extends EndpointDefinition<unknown, unknown, infer U> ? U : never
    get params(): T extends EndpointDefinition<unknown, unknown, unknown, infer U> ? U : never
}

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

type Endpoint<T extends EndpointDefinition<unknown, unknown>> = {
    method: HttpMethod
    path: string
    _type: T // dummy property for typings
}

type ControllerMetadata<T extends EndpointDefinition<unknown, unknown>> = {
    handler: HandlerFunction
    endpoint: Endpoint<T>
}

export type EndpointDefinition<
    Body,
    Response,
    Query = unknown,
    Params extends Record<string, unknown> = Record<string, unknown>,
> = {
    body: Body
    response: Response
    query: Query
    params: Params
}

export type Controller<T extends EndpointDefinition<unknown, unknown>> = (ctx: RequestContext<T>) => Promise<T['response']>

export function defineHandler<T extends Endpoint<any>>(
    definition: T,
    controller: Controller<T['_type']>
): ControllerMetadata<T['_type']> {
    return {
        endpoint: definition,
        handler: async (req, res) => {
            const response = await controller({} as unknown as RequestContext<T['_type']>)

            if (response) {
                res.json(response)
            } else {
                res.sendStatus(HttpStatusCode.Ok)
            }
        },
    }
}

export function defineEndpoint<Body, Response, Query = never, Params extends Record<string, unknown> = Record<string, unknown>>(
    method: HttpMethod,
    path: string
): Endpoint<EndpointDefinition<Body, Response, Query, Params>> {
    return {
        method,
        path,
        _type: {} as unknown as EndpointDefinition<Body, Response, Query, Params>,
    }
}

export function registerHandlers<T extends Record<string, ControllerMetadata<any>>>(api: API, handlers: T) {
    for (const key of Object.keys(handlers)) {
        const controller = handlers[key] as ControllerMetadata<any>
        const method: Lowercase<HttpMethod> = controller.endpoint.method.toLowerCase() as Lowercase<HttpMethod>
        api[method](controller.endpoint.path, controller.handler)
    }
}

type OmitNever<T> = Omit<
    T,
    keyof {
        [P in keyof T as T[P] extends never ? P : never]: T[P]
    }
>

type ApiArgs<T extends EndpointDefinition<unknown, unknown>> = OmitNever<Omit<T, 'response'>>
type ApiCall<T extends EndpointDefinition<unknown, unknown>> = (data: ApiArgs<T>) => Promise<T['response']>

export type ApiClient<T extends Record<string, Endpoint<any>>> = {
    [P in keyof T]: ApiCall<T[P]['_type']>
}

export function createApiClient<T extends Record<string, Endpoint<any>>>(endpoints: T): ApiClient<T> {
    const client: any = {}
    const http = axios.create() // TODO more flexibility
    for (const key of Object.keys(endpoints)) {
        const endpoint = endpoints[key]
        client[key] = async (data: ApiArgs<EndpointDefinition<object, never, object>>) => {
            // TODO auth
            const method: Lowercase<HttpMethod> = endpoint.method.toLowerCase() as Lowercase<HttpMethod>
            const path = (function () {
                // TODO parse params and build new path
                return endpoint.path
            })()

            let response
            if (method === 'get') {
                response = await http.get(path, {
                    params: data.query,
                })
            } else {
                response = await http[method](path, data.body)
            }

            // TODO throw if not OK
            return response.data
        }
    }

    return client as ApiClient<T>
}
