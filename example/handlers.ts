import { PostsGet, PostUpdate, Test } from './common.js'
import { ApiServer } from '../lib/index.js'

export const postGet = ApiServer.defineHandler(PostsGet, async () => {
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

export const postUpdate = ApiServer.defineHandler(PostUpdate, async (ctx) => {
    return {
        id: ctx.params.id,
        name: 'test 1',
        content: 'some text 1'
    }
});

export const testEndpoint = ApiServer.defineHandler(Test, async () => {
    console.log('working')
});