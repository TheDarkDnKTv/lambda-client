import { HttpStatusCode } from 'axios'
import { API, HandlerFunction, Request, Response } from 'lambda-api'
import { Endpoint, EndpointDefinition, Extract, RecursiveRecord } from './types.js'

export interface BaseRequestContext<T> {
    get body(): Extract.Body<T>

    get query(): Extract.Query<T>

    get params(): Extract.Params<T>
}

export type Controller<T extends EndpointDefinition, U extends BaseRequestContext<T> = BaseRequestContext<T>> = (
    ctx: U
) => Promise<Extract.Response<T>>
export type ContextProvider<T extends EndpointDefinition, U extends BaseRequestContext<T> = BaseRequestContext<T>> = (
    req: Request,
    res: Response
) => Promise<U> | U
export type ControllerMetadata<T extends EndpointDefinition = EndpointDefinition> = {
    handler: HandlerFunction
    endpoint: Endpoint<T>
}

export class BasicRequestContext<T extends EndpointDefinition = EndpointDefinition> implements BaseRequestContext<T> {
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

export function defineHandler<T extends Endpoint>(
    definition: T,
    controller: Controller<T['_type']>,
    contextProvider: ContextProvider<T['_type']> = (res, req) => new BasicRequestContext<T['_type']>(res, req)
): ControllerMetadata<T['_type']> {
    return {
        endpoint: definition,
        handler: async (req, res) => {
            const context = await contextProvider(req, res)
            const response = await controller(context)

            if (response) {
                res.json(response)
            } else {
                res.sendStatus(HttpStatusCode.Ok)
            }
        },
    }
}

/**
 * Compatible with nested APIs used with {@link API#register}
 * @param api
 * @param handlers
 */
export function registerHandlers<T extends RecursiveRecord<ControllerMetadata>>(api: API, handlers: T) {
    // @ts-expect-error property exists at implementation
    const prefix: string = (api._prefix as Array<string> ?? [])
        .filter(v => v && v.length > 0)
        .map(v => `/${v}`)
        .join('')
    function doRegister(map: Record<string, unknown>) {
        for (const key of Object.keys(map)) {
            const controller = map[key]
            if (isController(controller)) {
                const method = controller.endpoint.method
                const path =
                    prefix.length > 0 && controller.endpoint.path.startsWith(prefix)
                        ? controller.endpoint.path.slice(prefix.length)
                        : controller.endpoint.path
                api[method](path, controller.handler)
            } else if (typeof controller === 'object' && controller !== null) {
                doRegister(controller as Record<string, unknown>)
            }
            // skip non-controller types
        }
    }

    doRegister(handlers)
}

function isController(value: unknown): value is ControllerMetadata {
    return (
        typeof value === 'object' &&
        value !== null &&
        Object.prototype.hasOwnProperty.call(value, 'handler') &&
        Object.prototype.hasOwnProperty.call(value, 'endpoint')
    )
}
