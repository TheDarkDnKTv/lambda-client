import createAPI from 'lambda-api'
import * as handlers from './handlers.js'
import { ApiServer } from '../lib/index.js'

const api = createAPI()
ApiServer.registerHandlers(api, handlers);
