# walletts

extendable, composable, and hackable bitcoin wallet


## How to develop

first `yarn install` and 
**edit `node_modules/rxjs/scheduler/VirtualTimeScheduler.d.ts` and change it's
`work` methods definition to take `AsyncAction` instead of `VirtualAction`
**
ref https://github.com/ReactiveX/rxjs/issues/3031

and run
```
yarn test-without-nsp
```
for testing

NOTE: `yarn test` command will run `docker-compose` for running bitcoind in regtest mode
and generate some BTCs used in tests. So if you run to run each test mannually, you must run 
`docker-compose` beforehand by `yarn test:docker`
