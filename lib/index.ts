import axios, { HttpStatusCode } from 'axios'
// import * from 'lambda-api';
// import * as server from './test-server'
import { API } from 'lambda-api'
import {
    ApiArgs,
    ApiClient,
    BaseRequestContext,
    Controller,
    ControllerMetadata,
    Endpoint,
    EndpointDefinition,
    HttpMethod,
} from './types'

export function defineHandler<T extends Endpoint<any>>(
    definition: T,
    controller: Controller<T['_type']>
): ControllerMetadata<T['_type']> {
    return {
        endpoint: definition,
        handler: async (req, res) => {
            const response = await controller({} as unknown as BaseRequestContext<T['_type']>)

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

export function createApiClient<T extends Record<string, Endpoint<any>>>(endpoints: T): ApiClient<T> {
    const client: any = {}
    const http = axios.create() // TODO more flexibility
    for (const key of Object.keys(endpoints)) {
        const endpoint = endpoints[key]
        client[key] = async (data: ApiArgs<EndpointDefinition<object, never, object>>) => {
            // TODO auth
            const method = endpoint.method
            const path = (function () {
                // TODO parse params and build new path
                return endpoint.path
            })()

            let response
            if (method === HttpMethod.GET) {
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
