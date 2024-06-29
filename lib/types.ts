import { AxiosInstance, AxiosResponseHeaders, AxiosRequestConfig, CreateAxiosDefaults, RawAxiosResponseHeaders, AxiosResponse } from 'axios'
import { HandlerFunction, Request, Response } from 'lambda-api'
import { exec } from 'node:child_process'

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
export type ApiMethod<T extends EndpointDefinition> = keyof OmitNever<Omit<T, 'response'>> extends never ?
    (data?: ApiMethodArguments<T>) => Promise<ApiMethodResponse<T['response']>> :
    (data: ApiMethodArguments<T>) => Promise<ApiMethodResponse<T['response']>>

export type ApiClient<T extends Record<string, Endpoint>, U extends keyof T = keyof T> = {
    [P in Uncapitalize<U extends string ? U : never>]: ApiMethod<T[Capitalize<P>]['_type']>
}

export type ContextProvider<T extends EndpointDefinition, U extends BaseRequestContext<T> = BaseRequestContext<T>> = (req: Request, res: Response) => Promise<U> | U;
export interface ApiClientConfig<T extends Endpoint = Endpoint> {

    /**
     * Make sure you're not touching `validateStatus` property, as throwing error from axios will violate logic of handling responses
     * @param config
     */
    createAxios(config: CreateAxiosDefaults): AxiosInstance;

    /**
     * You can overwrite config, but be careful with `params`, as it is set to query params
     * @param initialConfig
     * @param endpoint
     */
    prepareRequestConfig(endpoint: T, initialConfig: AxiosRequestConfig): AxiosRequestConfig;

    /**
     *
     * @param response
     * @returns true if request contains errors, and will return {@link ApiError}
     */
    isResponseInvalid(response: AxiosResponse): boolean;
}

export type ApiError = {
    code: number,
    message: string,
    headers: RawAxiosResponseHeaders | AxiosResponseHeaders,
    body?: Record<string, unknown>
}