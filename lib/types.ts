import { HandlerFunction } from 'lambda-api'

export interface BaseRequestContext<T> {
    get body(): T extends EndpointDefinition<infer U, unknown> ? U : never

    get query(): T extends EndpointDefinition<unknown, unknown, infer U> ? U : never

    get params(): T extends EndpointDefinition<unknown, unknown, unknown, infer U> ? U : never
}

export enum HttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    PATCH = 'patch',
    DELETE = 'delete',
}

export type Endpoint<T extends EndpointDefinition<unknown, unknown>> = {
    method: HttpMethod
    path: string
    _type: T // dummy property for typings
}
export type ControllerMetadata<T extends EndpointDefinition<unknown, unknown>> = {
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
export type Controller<T extends EndpointDefinition<unknown, unknown>> = (ctx: BaseRequestContext<T>) => Promise<T['response']>
type OmitNever<T> = Omit<
    T,
    keyof {
        [P in keyof T as T[P] extends never ? P : never]: T[P]
    }
>
export type ApiArgs<T extends EndpointDefinition<unknown, unknown>> = OmitNever<Omit<T, 'response'>>
type ApiCall<T extends EndpointDefinition<unknown, unknown>> = (data: ApiArgs<T>) => Promise<T['response']>
export type ApiClient<T extends Record<string, Endpoint<any>>> = {
    [P in keyof T]: ApiCall<T[P]['_type']>
}