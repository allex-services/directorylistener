var Fs = require('fs');

function createDirectoryListenerService(execlib, ParentService, dirlib, timerlib) {
  'use strict';
  var dataSuite = execlib.dataSuite,
    lib = execlib.lib,
    q = lib.q,
    Timer = timerlib.Timer;

  function factoryCreator(parentFactory) {
    return {
      'service': require('./users/serviceusercreator')(execlib, parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib, parentFactory.get('user')) 
    };
  }

  function DirectoryListenerService(prophash) {
    prophash.satisfaction = {
      op: 'eq',
      field: 'transfer_done',
      value: true
    };
    ParentService.call(this, prophash);
    dirlib.util.satisfyPath(prophash.root);
    this.root = prophash.root;
    this.supersink = null;
    this.db = new dirlib.DataBase(prophash.root);
    this.needpropertyhash = prophash.needpropertyhash;
    this.responseextension = prophash.responseextension;
    this.onrequestsuccess = prophash.onrequestsuccess;
    this.requestFileRegExp = new RegExp(prophash.requestfilemask);
    this.timers = new lib.Map();
  }
  
  ParentService.inherit(DirectoryListenerService, factoryCreator, require('./storagedescriptor'));
  
  DirectoryListenerService.prototype.__cleanUp = function() {
    if (this.timers) {
      lib.containerDestroyAll(this.timers);
      this.timers.destroy();
    }
    this.timers = null;
    this.requestFileRegExp = null;
    this.onrequestsuccess = null;
    this.responseextension = null;
    this.needpropertyhash = null;
    if (this.db) {
      this.db.destroy();
    }
    this.db = null;
    this.supersink = null;
    this.root = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  
  DirectoryListenerService.prototype.onSuperSink = function (supersink) {
    this.supersink = supersink;
    Fs.readdir(this.root, this.onDirRead.bind(this));
    return ParentService.prototype.onSuperSink.call(this, supersink);
  };

  DirectoryListenerService.prototype.createStorage = function(storagedescriptor) {
    return ParentService.prototype.createStorage.call(this, storagedescriptor);
  };

  DirectoryListenerService.prototype.onNeedSatisfied = function (satisfieddatahash) {
    var instancename = satisfieddatahash.instancename;
    console.log('process', satisfieddatahash.instancename, '?,', this.onrequestsuccess);
    switch (this.onrequestsuccess) {
      case 'delete':
        console.log('ok, drop');
        this.db.drop(instancename).then(this.superOnNeedSatisfied.bind(this, satisfieddatahash)); //rejection handling?
        break;
      case 'move':
        this.db.move(instancename, instancename+'.'+lib.uid()).then(this.superOnNeedSatisfied.bind(this, satisfieddatahash)); //rejection handling?
        break;
      default:
        this.superOnNeedSatisfied(satisfieddatahash);
        break;
    }
  };

  DirectoryListenerService.prototype.propertyHashDescriptor = {
    root: {
      oneOf: [{
        type: 'string',
      },{
        type: 'array',
        items: {
          type: 'string'
        }
      }]
    },
    requestfilemask: {
      type: 'string'
    },
    responseextension: {
      type: 'string'
    }
  };

  DirectoryListenerService.prototype.superOnNeedSatisfied = function (satisfieddatahash) {
    console.log('superOnNeedSatisfied', satisfieddatahash);
    ParentService.prototype.onNeedSatisfied.call(this, satisfieddatahash);
  };

  DirectoryListenerService.prototype.triggerProduceNeed = function (filename) {
    var timer = this.timers.get(filename);
    if (!timer) {
      this.timers.add(filename, new Timer(this.tryProduceNeed.bind(this, filename), -lib.intervals.Second));
    } else {
      timer.reset();
    }
  };

  DirectoryListenerService.prototype.tryProduceNeed = function (filename) {
    var d;
    this.timers.remove(filename);
    if (this.requestFileRegExp.test(filename)) {
      this.testForResponseExistence(filename).then(
        this.spawnRequestNeed.bind(this, filename)
      );
    }
  };

  DirectoryListenerService.prototype.spawnRequestNeed = function (filename, responseexists) {
    if (responseexists) {
      return;
    }
    console.log('ok,', filename, 'will go');
    this.supersink.call('spawn', {
      instancename: filename
    });
  };

  DirectoryListenerService.prototype.onFile = function (operation, file) {
    if ('change' === operation) {
      this.triggerProduceNeed(file);
    }
  };

  DirectoryListenerService.prototype.onDirRead = function (err, files) {
    console.log('onDirRead', arguments);
    if (lib.isArray(files)) {
      files.forEach(this.tryProduceNeed.bind(this));
    }
    Fs.watch(this.root, {
      //all defaults
      persistent: true,
      recursive: false,
      encoding: 'utf8'
    }, this.onFile.bind(this));
  };

  DirectoryListenerService.prototype.testForResponseExistence = function (filename) {
    var d = q.defer();
    dirlib.util.FStats(filename, d);
    return d.promise;
  };

  return DirectoryListenerService;
}

module.exports = createDirectoryListenerService;
