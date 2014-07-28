Etcd = require('node-etcd');

etcd = new Etcd('172.17.8.101');

etcd.del("/bmp/apps", console.log);
