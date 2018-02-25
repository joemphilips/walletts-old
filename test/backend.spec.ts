import BackendProxyWeb from '../src/backend/web'
import anyTest, {ExecutionContext, TestInterface} from 'ava'
import startMockServer, {url} from './helpers/mock-server'
type myContext = {pw: BackendProxyWeb}
const test = anyTest as TestInterface<myContext>

startMockServer(test)
const inst = new BackendProxyWeb(url)

test.beforeEach((t: ExecutionContext<myContext>) => {
  // t.context.p = new BackendProxy()
  console.log(`going to make instance with url ${url}`)
  t.context = {pw: new BackendProxyWeb(url)};
  console.log( `instance created! ${t.context.pw.url}`)
  console.log(`inst is ${inst}`)
})

test('can ping to the backend', async (t: ExecutionContext<myContext>) => {
  const inst2 = new BackendProxyWeb(url)
  console.log(`going to assert ${inst2}`)
  t.notThrows(inst2.ping);
})

test('can receive new Project Information from Server', (t: any) => {
  t.pass();
})
