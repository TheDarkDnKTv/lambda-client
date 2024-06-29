import createAPI from 'lambda-api'
import * as endpoints from './handlers'
import { registerHandlers } from '../lib'

const api = createAPI()
registerHandlers(api, endpoints)
