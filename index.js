function createServicePack(execlib) {
  'use strict';
  return {
    service: {
      dependencies: ['allex_needingservice', 'allex_directorylib', 'allex_timerlib']
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
