var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/linux');
var TEMPLATES_DIR = path.resolve(__dirname, '../../templates/linux');

exports.setup = function(installMongo, setupNode, nodeVersion, setupPhantom, appName, deployPath) {
  var taskList = nodemiral.taskList('Setup (linux)');

  // Installation
  if(setupNode) {
    taskList.executeScript('Installing Node.js', {
      script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
      vars: {
        nodeVersion: nodeVersion
      }
    });
  }

  if(setupPhantom) {
    taskList.executeScript('Installing PhantomJS', {
      script: path.resolve(SCRIPT_DIR, 'install-phantomjs.sh')
    });
  }

  taskList.executeScript('Setting up Environment', {
    script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
    vars: {
      appName: appName,
      deployPath: deployPath
    }
  });

  if(installMongo) {
    taskList.copy('Copying MongoDB configuration', {
      src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
      dest: '/etc/mongodb.conf'
    });

    taskList.executeScript('Installing MongoDB', {
      script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
    });
  }

  //Configurations
  taskList.copy('Configuring upstart', {
    src: path.resolve(TEMPLATES_DIR, 'meteor.conf'),
    dest: '/etc/init/' + appName + '.conf',
    vars: {
      appName: appName,
      deployPath: deployPath
    }
  });

  return taskList;
};

exports.deploy = function(bundlePath, env, deployCheckWaitTime, appName, deployPath) {
  var taskList = nodemiral.taskList("Deploy app '" + appName + "' to " + deployPath + " (linux)");

  taskList.copy('Uploading bundle', {
    src: bundlePath,
    dest: deployPath + '/' + appName + '/tmp/bundle.tar.gz'
  });

  taskList.copy('Setting up Environment Variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: deployPath + '/' + appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName,
      deployPath: deployPath
    }
  });

  // deploying
  taskList.executeScript('Invoking deployment process', {
    script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
    vars: {
      deployCheckWaitTime: deployCheckWaitTime || 10,
      appName: appName,
      deployPath: deployPath
    }
  });

  return taskList;
};

exports.reconfig = function(env, appName, deployPath) {
  var taskList = nodemiral.taskList("Updating configurations (linux)");

  taskList.copy('Setting up Environment Variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: deployPath + '/' + appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName,
      deployPath: deployPath
    }
  });

  //deploying
  taskList.execute('Restarting app', {
    command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
  });

  return taskList;
};
