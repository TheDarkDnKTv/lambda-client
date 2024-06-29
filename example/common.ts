import { defineCustomEndpoint, defineEndpoint } from '../lib'
import { Endpoint, EndpointDefinition, HttpMethod } from '../lib/types'

export type MyEndpoint<T extends EndpointDefinition = EndpointDefinition> = Endpoint<T> & { auth: boolean };

type Post = {
    id: number
    name: string
    content: string
}

type PostsGetDef = EndpointDefinition<never, Array<Post>, never, never>;
type PostUpdateDef = EndpointDefinition<Omit<Post, 'id'>, Post, never, { id: number }>;

export const PostsGet = defineEndpoint<PostsGetDef>(HttpMethod.GET, '/posts');
export const PostUpdate = defineCustomEndpoint<MyEndpoint<PostUpdateDef>>(HttpMethod.GET, '/post/:id', { auth: true });
