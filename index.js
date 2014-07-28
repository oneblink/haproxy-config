exec = require('child_process').exec;
os = require('os');
fs = require('fs');
Etcd = require('node-etcd');
mustache = require('mustache');
_ = require('underscore');
HAProxy = require('haproxy');

etcdServer = process.env.ETCD_SERVER;
etcdKey = process.env.ETCD_KEY || '/bmp/apps';
outputDir = process.env.OUTPUT_DIR || '.';
template = '';
etcd = null;
haproxy = new HAProxy('/tmp/haproxy.sock', {
  config: outputDir + '/haproxy.cfg'
});

if (process.env.ETCD_SERVER) {
  start();
} else {
  exec("route -n | grep 'UG[ \t]' | awk '{print $2}'", function (err, stdout, stderr) {
    if (err) {
      console.log(Date.now() + ': ' + 'Could not determine ETCD address: ' + err);
    }
    etcdServer = stdout.toString().substr(0, stdout.length - 1);
    console.log(Date.now() + ': ' + 'ETCD address set to: ' + etcdServer);
    start();
  });
}

function start() {
  etcd = new Etcd(etcdServer);
  fs.readFile('./template.mustache', {encoding: 'utf8'}, function (err, templateFile) {
    if (err) {
      console.log(Date.now() + ': ' + 'Error loading mustache template: ' + err);
      return;
    }
    console.log(Date.now() + ': ' + 'Config service loaded');
    template = templateFile;
    getData(function () {
      haproxy.start(function (err) {
        if (err) {
          console.log(Date.now() + ': ' + 'Error starting HAProxy: ' + err);
          return;
        }
        console.log(Date.now() + ': ' + 'Started HAProxy');
        etcd.watcher(etcdKey, null, { recursive: true }).on('change', watcherHandler);
      })
    });
  });
}

function watcherHandler() {
  console.log(Date.now() + ': ' + 'Detected changes to the etcd configuration');
  getData(restartHAProxy);
}

function getData(callback) {
  console.log(Date.now() + ': ' + 'Fetching the etcd stored config');
  etcd.get(etcdKey, { recursive: true }, processData(callback));
}

function processData (callback) {
  return function (err, data) {
    var nodes, templateData;
    if (err) {
      console.log(Date.now() + ': ' + 'Error fetching the etcd config: ' + err);
      return;
    }
    console.log(Date.now() + ': ' + 'Processing etcd config');

    templateData= {};

    nodes = (_.flatten(_.pluck(data.node.nodes, 'nodes')));

    templateData.backends = _.map(nodes, function (value) {
      var key, servers;

      key = value.key.split('/');
      servers = _.map(value.nodes, function (value) {
        if (value.nodes[0].key.split('/')[6] === 'server') {
          return {
            server: value.nodes[0].value,
            port: value.nodes[1].value
          }
        }
        return {
          server: value.nodes[1].value,
          port: value.nodes[0].value
        }
      })

      return {
        name: key[3] + '-' + key[4],
        servers: servers
      }
    });

    templateData.frontends = _.uniq(_.map(data.node.nodes, function (value) {
      return {
        domain: value.key.split('/')[3],
        subdomain: value.key.split('/')[3].split('.')[0],
        acls: _.map(_.pluck(value.nodes, 'key'), function (value) {
          return value.split('/')[4]
        })
      }
    }));

    //console.log(templateData);
    writeTemplate (templateData, callback);
  };
}

function writeTemplate (templateData, callback) {
  console.log(Date.now() + ': ' + 'Creating new config file');
  fs.writeFile(outputDir + '/haproxy.cfg', mustache.render(template, templateData), function (err) {
    if (err) {
      console.log(Date.now() + ': ' + 'Error writing config file: ' + err);
    }
    console.log(Date.now() + ': ' + 'Config written to: ' + outputDir + '/haproxy.cfg');
    callback();
  });
}

function restartHAProxy() {
  haproxy.reload(function (err) {
    if (err) {
      console.log(Date.now() + ': ' + 'Error reloading HAProxy: ' + err);
    }
    console.log(Date.now() + ': ' + 'Reloaded HAProxy');
  });
}
