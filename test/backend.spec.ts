import BackendProxyWeb from '../src/backend/web'
import anyTest, {ExecutionContext, TestInterface} from 'ava'
import startMockServer, {url} from './helpers/mock-server'
type myContext = {pw: BackendProxyWeb}
const test = anyTest as TestInterface<myContext>

startMockServer(test)

test.beforeEach((t: ExecutionContext<myContext>) => {
  t.context = {pw: new BackendProxyWeb({url: url})};
})

test('can ping to the backend', async (t: ExecutionContext<myContext>) => {
  console.log(`going to assert ${t.context.pw.url}`)
  t.truthy(t.context.pw.ping);
})

test('can receive new Project Information from Server', (t: any) => {
  t.pass();
})
