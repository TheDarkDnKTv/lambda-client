import {ApiClient} from "./index";
import * as endpoints from './common';


const client = {} as ApiClient<typeof endpoints>;
async function test() {
    const result = await client.PostGet({
        params: {
            id: 0
        }
    });

    console.info(result.name);
}


test();