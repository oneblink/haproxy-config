FROM ubuntu:14.04

RUN apt-get update

RUN apt-get install nodejs npm nodejs-legacy -y

RUN apt-get install haproxy -y

ADD config /opt/haproxy-config/

WORKDIR /opt/haproxy-config

RUN npm install

VOLUME /haproxy-override

CMD ["node", "index.js"]
