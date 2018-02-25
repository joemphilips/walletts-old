import BackendProxyWeb from '../src/backend/web'
import anyTest, {ExecutionContext, TestInterface} from 'ava'
import startMockServer, {url} from './helpers/mock-server'
type myContext = {pw: BackendProxyWeb}
const test = anyTest as TestInterface<myContext>

test.beforeEach((t: ExecutionContext<myContext>) => {
  t.context = {pw: new BackendProxyWeb({url: url})};
})

test('can ping to the backend', async (t: ExecutionContext<myContext>) => {
  const result = t.context.pw.ping()
  console.dir(`result is ${JSON.stringify(result)}`)
  t.truthy(result);
})

test('can receive new Project Information from Server', (t: ExecutionContext<myContext>) => {
  t.pass();
})
