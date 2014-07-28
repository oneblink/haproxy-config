Etcd = require('node-etcd');

etcd = new Etcd('172.17.8.101');

etcd.set("/bmp/apps/fake1.blinkm.co/bb/1/server", 'blinkm.co', console.log);
etcd.set("/bmp/apps/fake1.blinkm.co/bb/1/port", '80');
etcd.set("/bmp/apps/fake1.blinkm.co/bb/2/server", 'edge.blinkm.co');
etcd.set("/bmp/apps/fake1.blinkm.co/bb/2/port", '80');

etcd.set("/bmp/apps/fake1.blinkm.co/integration/1/server", 'blinkm.co');
etcd.set("/bmp/apps/fake1.blinkm.co/integration/1/port", '80');

etcd.set("/bmp/apps/fake2.blinkm.co/integration/1/server", 'edge.blinkm.co');
etcd.set("/bmp/apps/fake2.blinkm.co/integration/1/port", '80');

etcd.set("/bmp/apps/fake2.blinkm.co/testingm/1/server", 'edge.blinkm.co');
etcd.set("/bmp/apps/fake2.blinkm.co/testingm/1/port", '80');

etcd.set("/bmp/apps/fake3.blinkm.co/demos/1/server", 'd.blinkm.co');
etcd.set("/bmp/apps/fake3.blinkm.co/demos/1/port", '80');
