# walletts

extendable, composable, and hackable bitcoin wallet


## How to develop

first `yarn install` and 
**edit `node_modules/rxjs/scheduler/VirtualTimeScheduler.d.ts` and change it's
`work` methods definition to take `AsyncAction` instead of `VirtualAction`
**
ref https://github.com/ReactiveX/rxjs/issues/3031
