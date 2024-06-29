import { defineEndpoint } from '../lib'
import { EndpointDefinition, HttpMethod } from '../lib/types'

type Post = {
    id: number
    name: string
    content: string
}

type PostGetDef = EndpointDefinition<never, Post, never, { id: number }>;
export const PostGet = defineEndpoint<PostGetDef>(HttpMethod.GET, '/post/:id');
