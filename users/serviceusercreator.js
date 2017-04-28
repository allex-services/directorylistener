function createServiceUser(execlib, ParentUser) {
  'use strict';

  var lib = execlib.lib;

  if (!ParentUser) {
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function ServiceUser(prophash) {
    ParentUser.call(this, prophash);
  }
  
  ParentUser.inherit(ServiceUser, require('../methoddescriptors/serviceuser'), [/*visible state fields here*/]/*or a ctor for StateStream filter*/, require('../visiblefields/serviceuser'));
  ServiceUser.prototype.__cleanUp = function () {
    ParentUser.prototype.__cleanUp.call(this);
  };

  ServiceUser.prototype.acquireSink = function (spawnrecord, spawndescriptor) {
    lib.extend(spawnrecord, this.__service.needpropertyhash);
    spawnrecord.responseextension = this.__service.responseextension;
    spawnrecord.db = this.__service.db;
    return ParentUser.prototype.acquireSink.call(this, spawnrecord, spawndescriptor);
  };

  return ServiceUser;
}

module.exports = createServiceUser;
