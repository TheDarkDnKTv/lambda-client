import { Endpoint, EndpointDefinition, HttpMethod, defineCustomEndpoint, defineEndpoint } from '../lib/index.js'

export type MyEndpoint<T extends EndpointDefinition = EndpointDefinition> = Endpoint<T> & { auth: boolean };

type Post = {
    id: number
    name: string
    content: string
}

type PostsGetDef = EndpointDefinition<never, Array<Post>, never, never>;
type PostUpdateDef = EndpointDefinition<Omit<Post, 'id'>, Post, never, { id: number }>;

export const Test = defineEndpoint<{ body: never, response: void, query: never, params: never }>(HttpMethod.GET, '/');
export const PostsGet = defineEndpoint<PostsGetDef>(HttpMethod.GET, '/posts');
export const PostUpdate = defineCustomEndpoint<MyEndpoint<PostUpdateDef>>(HttpMethod.GET, '/post/:id', { auth: true });

export const client = {
    testEndpoint: Test,
    post: {
        getPosts: PostsGet,
        updatePost: PostUpdate
    }
}
