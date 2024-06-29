import { createApiClient } from './index'
import * as endpoints from './common'
import { ApiClient } from './types'

const client = createApiClient(endpoints);
async function test() {
    const result = await client.PostGet({
        params: {
            id: 0,
        }
    })

    console.info(result.name)
}

test()
