import BackendProxyWeb from '../src/backend/web'
import test, {TestContext} from 'ava'
import startMockServer, {mockServerURL as url} from './helpers/mock-server'

startMockServer(test)
test.beforeEach((t: any) => {
  // t.context.p = new BackendProxy()
  t.context.pw = new BackendProxyWeb(url);
})

test('can ping to the backend', (t: any) => {
  t.context.pw.ping()
})

test('can receive new Project Information from Server', (t: any) => {
  t.pass();
})
