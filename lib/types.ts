import { AxiosInstance, AxiosResponseHeaders, CreateAxiosDefaults, RawAxiosResponseHeaders } from 'axios'
import { HandlerFunction, Request, Response } from 'lambda-api'

export enum HttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    PATCH = 'patch',
    DELETE = 'delete',
}

export type EndpointDefinition<
    Body = unknown,
    Response = unknown,
    Query = unknown,
    Params extends Record<string, unknown> = Record<string, unknown>,
> = {
    body: Body
    response: Response
    query: Query
    params: Params
}

export namespace Extract {
    export type Body<T> = T extends EndpointDefinition<infer U> ? U : never;
    export type Response<T> = T extends EndpointDefinition<unknown, infer U> ? U : never;
    export type Query<T> = T extends EndpointDefinition<unknown, unknown, infer U> ? U : never;
    export type Params<T> = T extends EndpointDefinition<unknown, unknown, unknown, infer U> ? U : never;
}

export type Endpoint<T extends EndpointDefinition = EndpointDefinition> = {
    method: HttpMethod
    path: string
    _type: T // dummy property for typings
}

export interface BaseRequestContext<T> {
    get body(): Extract.Body<T>

    get query(): Extract.Query<T>

    get params(): Extract.Params<T>
}

export type ControllerMetadata<T extends EndpointDefinition = EndpointDefinition> = {
    handler: HandlerFunction
    endpoint: Endpoint<T>
}

export type Controller<T extends EndpointDefinition, U extends BaseRequestContext<T> = BaseRequestContext<T>> = (ctx: U) => Promise<Extract.Response<T>>

type OmitNever<T> = Omit<T, keyof {
    [P in keyof T as T[P] extends never ? P : never]: T[P]
}>

export type ApiMethodArguments<T extends EndpointDefinition> = OmitNever<Omit<T, 'response'>>
export type ApiMethodResponse<T> = [ null, ApiError ] | [ T, null ];
export type ApiMethod<T extends EndpointDefinition> = (data: ApiMethodArguments<T>) => Promise<ApiMethodResponse<T['response']>>
export type ApiClient<T extends Record<string, Endpoint>, U extends keyof T = keyof T> = {
    [P in Uncapitalize<U extends string ? U : never>]: ApiMethod<T[Capitalize<P>]['_type']>
}

export type ContextProvider<T extends EndpointDefinition, U extends BaseRequestContext<T> = BaseRequestContext<T>> = (req: Request, res: Response) => Promise<U> | U;
export type AxiosProvider = (config: CreateAxiosDefaults) => AxiosInstance;

export type ApiError = {
    code: number,
    message: string,
    headers: RawAxiosResponseHeaders | AxiosResponseHeaders,
    body?: Record<string, unknown>
}