const asyncHooks = require('async_hooks');
const fs = require('fs');
const http = require('http');
const util = require('util');

/* 
 * `console.log` will cause AsyncHooks callbacks to be executed
 * because it is an asyncronous operation. As a result, it will 
 * cause infinite recursion. This code uses `fs.writeSync` instead.
 *
 * https://nodejs.org/dist/latest-v8.x/docs/api/async_hooks.html#async_hooks_printing_in_asynchooks_callbacks
 */
const traceLifecycle = (lifecycle) => (...args) => {
  fs.writeSync(1, `${lifecycle} ${util.format(...args)}\n`);
};

const init = traceLifecycle('hook:init');
const before = traceLifecycle('hook:before');
const after = traceLifecycle('hook:after');
const destroy = traceLifecycle('hook:destroy')
const promiseResolve = traceLifecycle('hook:promiseResolve');
const hook = asyncHooks.createHook({ 
  init, 
  before, 
  after, 
  destroy, 
  promiseResolve 
}).enable();

const server = http.createServer((req, res) => {
  console.log('Hello World!');
  res.end();
});

server.listen(3000);