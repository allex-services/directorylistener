function createServicePack(execlib) {
  'use strict';
  return {
    service: {
      dependencies: ['allex:needing', 'allex:directory:lib', 'allex:timer:lib']
    },
    sinkmap: {
      dependencies: ['allex:needing']
    }, /*
    tasks: {
      dependencies: []
    }
    */
  }
}

module.exports = createServicePack;
