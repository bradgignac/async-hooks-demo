const _ = require('lodash');
const asyncHooks = require('async_hooks');
const fs = require('fs');
const http = require('http');
const util = require('util');

const _filterResourceTypes = false;
const _resourceTypeFilter = ['TCPWRAP'];

const _state = {
  resources: {}
};

/* `init` adds new AsyncHook-enabled resources to a lookup table */
const init = (asyncId, type, triggerAsyncId, resource) => {
  if (_filterResourceTypes && !_.includes(_resourceTypeFilter, type)) {
    return
  }
  
  _state.resources[asyncId] = { type, triggerAsyncId, resource }
  traceLifecycle('hook:init')(asyncId);
};

/* `destroy` removes AsyncHook-enabled resources from a lookup table */
const destroy = (asyncId) => {
  const lookup = _state.resources[asyncId];
  if (lookup) {
    traceLifecycle('hook:destroy')(asyncId);
    delete _state.resources[asyncId];
  }
}

/* 
 * `console.log` will cause AsyncHooks callbacks to be executed
 * because it is an asyncronous operation. As a result, it will 
 * cause infinite recursion. This code uses `fs.writeSync` instead.
 *
 * https://nodejs.org/dist/latest-v8.x/docs/api/async_hooks.html#async_hooks_printing_in_asynchooks_callbacks
 */
const traceLifecycle = (lifecycle) => (asyncId) => {
  const lookup = _state.resources[asyncId];
  lookup && fs.writeSync(1, `${lifecycle} ${lookup.type} ${asyncId}\n`);
};

const before = traceLifecycle('hook:before');
const after = traceLifecycle('hook:after');
const promiseResolve = traceLifecycle('hook:promiseResolve');
const hook = asyncHooks.createHook({ 
  init, 
  before, 
  after, 
  destroy, 
  promiseResolve 
}).enable();

const server = http.createServer();
server.on('request', (req, res) => {
  console.log('Received request', asyncHooks.executionAsyncId(), asyncHooks.triggerAsyncId());  
  res.end();
});
server.listen(3000);