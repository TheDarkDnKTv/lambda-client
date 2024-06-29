import createAPI from 'lambda-api'
import * as endpoints from './server'
import { registerHandlers } from './index'

const api = createAPI()
registerHandlers(api, endpoints)
