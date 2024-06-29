import { defineHandler } from '../lib'
import { PostsGet, PostUpdate } from './common'

export const postGet = defineHandler(PostsGet, async () => {
    return [
        {
            id: 1,
            name: 'test 1',
            content: 'some text 1'
        },
        {
            id: 2,
            name: 'test 2',
            content: 'some text 2'
        }
    ]
});

export const postUpdate = defineHandler(PostUpdate, async (ctx) => {
    return {
        id: ctx.params.id,
        name: 'test 1',
        content: 'some text 1'
    }
});