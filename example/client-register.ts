import { createApiClient } from '../lib'
import * as endpoints from './common'

const client = createApiClient('https://our-backend-url', endpoints);
async function test() {
    const [ result, error] = await client.postGet({
        params: {
            id: 0,
        }
    })

    if (!result) {
        console.error(error);
        throw new Error();
    }

    console.info(result.name)
}

test()
