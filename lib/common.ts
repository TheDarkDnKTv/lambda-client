import {defineEndpoint, HttpMethod} from "./index";

type Post = {
    id: number,
    name: string,
    content: string
};

export const PostGet = defineEndpoint<never, Post, never, { id: number }>(HttpMethod.GET, '/post/:id');