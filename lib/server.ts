import {defineHandler} from "./index";
import {PostGet} from "./common";

export const postGet = defineHandler(PostGet, async (ctx) => {
    return {
        id: ctx.params.id,
        content: '',
        name: ''
    }
})