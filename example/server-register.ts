import createAPI from 'lambda-api'
import * as handlers from './handlers'
import * as endpoints from './common'
import { registerHandlers } from '../lib'

const api = createAPI()
registerHandlers(api, handlers, endpoints);
