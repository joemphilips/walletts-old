import BackendProxy from '../src/backend'
import test, {TestContext} from 'ava'
import startMockServer from './helpers/mock-server'

startMockServer(test)

test('can receive new Project Information from Server', (t: TestContext) => {
  t.pass();
})
