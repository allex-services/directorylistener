function createServicePack(execlib) {
  'use strict';
  return {
    service: {
      dependencies: ['allex_needingservice', 'allex:directory:lib', 'allex:timer:lib']
    },
    sinkmap: {
      dependencies: ['allex_needingservice']
    }, /*
    tasks: {
      dependencies: []
    }
    */
  }
}

module.exports = createServicePack;
