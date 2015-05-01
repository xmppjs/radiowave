# RadioWave

RadioWave is a lightweight XMPP server that is made for the web:

 - easy deployment
 - simple configuration via JSON
 - fast
 - rest api

## Quickstart

### Docker

```
# Start PostgresSQL
docker run --name radiowave-pg -e POSTGRES_PASSWORD=mysecretpassword -d postgres

# Start Radiowave
docker build -t radiowave .
docker run --name radiowave --link radiowave-pg:pg -d -p 5222:5222 -p 5280:5280 -p 9031:9031 -p 9030:9030 -p 8080:8080 radiowave

# detect ip if you are using boot2docker via `boot2docker ip`

# Debug Docker container
docker exec -it radiowave /bin/bash

```

By default three users are configured:

```json
    "type": "simple",
    "testusers": true,
    "users": [{
        "user": "romeo",
        "password": "romeo"
    }, {
        "user": "mercutio",
        "password": "mercutio"
    }, {
        "user": "benvolio",
        "password": "benvolio"
    }]
``

Configure Adium

![Adium Config](https://raw.github.com/node-xmpp/radiowave/master/docs/config_adium_01.png)
![Adium Config](https://raw.github.com/node-xmpp/radiowave/master/docs/config_adium_02.png)

### Manual Installation

Prepare your server:

```bash
# debian
apt-get install libicu-dev

# mac (optional)
brew install icu4c
ln -s /usr/local/Cellar/icu4c/<VERSION>/bin/icu-config /usr/local/bin/icu-config
ln -s /usr/local/Cellar/icu4c/<VERSION>/include/* /usr/local/include
```

Adapt the `settings/default.json` to your needs. If you do not install a specific database, Radiowave will fallback to SQLite.

```
npm install -g radiowave
foreman start
```

### Register as service

```bash
foreman export upstart /etc/init
service radiowave start
```

# Features & Roadmap

✔ supported, ∅ partially supported by Radiowave, ✘ not supported by Radiowave (yet)
         
| Reference     | Description | Supported |
| ------------- | ----------- | --------- |
| Core XMPP specifications |||
| [RFC-3920 Extensible Messaging and Presence Protocol (XMPP): Core](http://tools.ietf.org/html/rfc3920)      | XMPP Core mechanisms and routing | ✔ |
| [RFC-3921 XMPP: Instant Messaging and Presence](http://tools.ietf.org/html/rfc3921)      | XMPP IM and presence | ∅ |
| [RFC-6120 XMPP: Core ](http://tools.ietf.org/html/rfc6120)      | RFC-3920 update| ✔ |
| [RFC-6121 XMPP: Instant Messaging and Presence](http://tools.ietf.org/html/rfc6121)      | RFC-3920 update | ∅ |
| [RFC-6122 XMPP: Address Format](http://tools.ietf.org/html/rfc6122)      | Format for user and services addresses | ✔ |
| XMPP Server compliance |||
| [XEP-0212: XMPP Basic Server 2008](http://xmpp.org/extensions/xep-0212.html) | Compliance Specification | ✘ |
| [XEP-0216: XMPP Intermediate IM Server 2008](http://xmpp.org/extensions/xep-0216.html) | Compliance Specification | ✘ |
| [XEP-0243: XMPP Server Compliance 2009](http://xmpp.org/extensions/xep-0243.html) | Compliance Specification | ✘ |
| [XEP-0270: XMPP Compliance Suites 2010](http://xmpp.org/extensions/xep-0270.html) | Compliance Specification | ✘ |
| [XEP-0302: XMPP Compliance Suites 2012](http://xmpp.org/extensions/xep-0302.html) | Compliance Specification| ✘ |
| XMPP Core Server Extensions     |||
| [XEP-0030: Service Discovery](http://xmpp.org/extensions/xep-0030.html)  | Discover features and capabilities of server | ✘ |
| [XEP-0115: Entity Capabilities](http://xmpp.org/extensions/xep-0115.html)  |  | ✘ |
| XMPP Advanced Server Extensions  |||
| [XEP-0045: Multi-User Chat](http://xmpp.org/extensions/xep-0045.html)  | Chat conferences with multiple users | ✘ |
| [XEP-0054: vcard-temp](http://xmpp.org/extensions/xep-0054.html) | Business cards storage |✘|
| [XEP-0060: Publish-Subscribe](http://xmpp.org/extensions/xep-0060.html)  | Publish and subscribe over xmpp| ∅ |
| [XEP-0114: Jabber Component Protocol](http://xmpp.org/extensions/xep-0114.html) | Server-side components |✘|
| [XEP-0124: BOSH](http://xmpp.org/extensions/xep-0124.html) | BOSH HTTP Binding|✘|
| [XEP-0163: Personal Eventing Protocol](http://xmpp.org/extensions/xep-0163.html) | user location, modd or activity |✘|
| [XEP-0191: Blocking Command](http://xmpp.org/extensions/xep-0191.html) | Communication blocking|✘|
| [XEP-0198: Stream Management](http://xmpp.org/extensions/xep-0198.html) | Stream commands|✘|
| [XEP-0206: XMPP Over BOSH](http://xmpp.org/extensions/xep-0206.html)  | Connect over HTTP with long-polling |✘ |
| XMPP Extensions     |||
| [XEP-0004: Data Forms](http://xmpp.org/extensions/xep-0004.html) | XML Forms for queries and responses| ✘ |
| [XEP-0092: Software Version](http://xmpp.org/extensions/xep-0092.html)  | Discover software release| ✔ |
| [XEP-0199: XMPP Ping](http://xmpp.org/extensions/xep-0199.html)  | Ping Pong for XMPP | ✔ |
| [XEP-0203: Delayed Delivery](http://xmpp.org/extensions/xep-0203.html)  | Offline messaging|✘ |
| [DRAFT: Websocket](http://tools.ietf.org/html/draft-ietf-xmpp-websocket-00)  | Connect over HTTP with websockets |✘ |
| [XEP-0307:Unique Room Names for Multi-User Chat](http://xmpp.org/extensions/xep-0307.html)  | Create unique room names | ✔ |
| XMPP Security    |||
| [XEP-0077: In-band Registration](http://xmpp.org/extensions/xep-0077.html)  | For account creators | ✘ |
| [XEP-0158: CAPTCHA Forms](http://xmpp.org/extensions/xep-0158.html)  | Prevent bots | ✘ |
| [XEP-0205: Best Practices to Discourage Denial of Service Attacks](http://xmpp.org/extensions/xep-0205.html) | Prevent denial of service attacks | ✘ |


# FAQ

## REST api

Radiowave ships with a REST api. To determine the own JID:

```
curl -s --user romeo:romeo http://192.168.59.103:8080/api/user | jq '.'
{
  "user": "romeo@example.net"
}
```

Create a new MUC room via Rest API:

```bash
$ curl -s --user romeo:romeo http://192.168.59.103:8080/api/user/rooms | jq '.'
[]

$ curl -s -X POST --user romeo:romeo --data  '{"name" : "romeo"}' http://localhost:8080/api/user/rooms --header "Content-Type:application/json" | jq '.'
{
  "id": 1,
  "name": "romeo",
  "updatedAt": "2015-05-01T13:33:41.000Z",
  "createdAt": "2015-05-01T13:33:41.000Z"
}

$ curl -s --user romeo:romeo http://192.168.59.103:8080/api/user/rooms | jq '.'
[
  {
    "id": 1,
    "name": "romeo",
    "subject": null,
    "description": null,
    "createdAt": "2015-05-01T13:33:41.000Z",
    "updatedAt": "2015-05-01T13:33:41.000Z",
    "members": [
      {
        "jid": "romeo@example.net",
        "RoomMember": {
          "nickname": "",
          "role": "moderator",
          "affiliation": "owner",
          "state": "accepted",
          "createdAt": "2015-05-01 13:33:41.000 +00:00",
          "updatedAt": "2015-05-01 13:33:41.000 +00:00",
          "UserId": 1,
          "RoomId": 1
        }
      }
    ]
  }
]
```

## Database

Radiowave uses [sequelize](http://docs.sequelizejs.com/en/latest/) as database abstractions layer. While it provides support for PostgreSQL, MySQL, MariaDB, SQLite and MSSQL, Radiowave is only tested on SQLite and PostgresSQL. 

Radioware make heavy use of SQL transactions to ensure no data is corrupted. Since SQLite is not optimized for handling many parallel connection, I recommend to use PostgresSQL for production. Change the configuration file accordingly:

```json
"storage": {
    "dialect" : "postgres",
    "native": true,
    "user": "postgres",
    "password" : "supersecretpassword",
    "database": "radiowave",
    "host": "localhost",
    "port": 5432
}
```

## Logging

Radiowave uses [bunyan](https://github.com/trentm/node-bunyan) as logger framework. To format the json output pipe the content to bunyan.

```
$ node bin/radiowave settings/default.json |bunyan

[2015-05-01T13:31:25.029Z] DEBUG: radiowave/35782 on milkyway.fritz.box: Load file: /Users/chris/Development/xrocket/xrocketd/settings/default.json (widget_type=radiowave)
[2015-05-01T13:31:25.047Z] DEBUG: radiowave/35782 on milkyway.fritz.box: Environment: development (widget_type=radiowave)
[2015-05-01T13:31:25.048Z] DEBUG: radiowave/35782 on milkyway.fritz.box: port: 5222 (widget_type=radiowave)
[2015-05-01T13:31:25.048Z] DEBUG: radiowave/35782 on milkyway.fritz.box: port: 5280 (widget_type=radiowave)
[2015-05-01T13:31:25.048Z] DEBUG: radiowave/35782 on milkyway.fritz.box: port: 5281 (widget_type=radiowave)
[2015-05-01T13:31:25.048Z] DEBUG: radiowave/35782 on milkyway.fritz.box: port: 8889 (widget_type=radiowave)
[2015-05-01T13:31:25.048Z] DEBUG: radiowave/35782 on milkyway.fritz.box: port: 8080 (widget_type=radiowave)
[2015-05-01T13:31:25.049Z] DEBUG: radiowave/35782 on milkyway.fritz.box: load storage module (widget_type=radiowave)
[2015-05-01T13:31:25.050Z] DEBUG: radiowave/35782 on milkyway.fritz.box: initialize (widget_type=storage)
[2015-05-01T13:31:25.234Z] DEBUG: radiowave/35782 on milkyway.fritz.box: load connection manger (widget_type=radiowave)
[2015-05-01T13:31:25.241Z] DEBUG: radiowave/35782 on milkyway.fritz.box: load xmpp components (widget_type=radiowave)
[2015-05-01T13:31:25.241Z] DEBUG: radiowave/35782 on milkyway.fritz.box: Configure domain: example.net (widget_type=radiowave)
[2015-05-01T13:31:25.245Z]  INFO: radiowave/35782 on milkyway.fritz.box: load components Core (widget_type=radiowave)
[2015-05-01T13:31:25.246Z] DEBUG: radiowave/35782 on milkyway.fritz.box: load core modules (widget_type=core)
[2015-05-01T13:31:25.247Z]  INFO: radiowave/35782 on milkyway.fritz.box: load RFC 3921: Roaster (widget_type=roaster)
[2015-05-01T13:31:25.247Z] DEBUG: radiowave/35782 on milkyway.fritz.box: load module: RFC 3921: Roaster (widget_type=xcomponent)
[2015-05-01T13:31:25.248Z]  INFO: radiowave/35782 on milkyway.fritz.box: load XEP-0016: Privacy Lists (widget_type=privacylist)
[2015-05-01T13:31:25.248Z] DEBUG: radiowave/35782 on milkyway.fritz.box: load module: XEP-0016: Privacy Lists (widget_type=xcomponent)
[2015-05-01T13:31:25.248Z]  INFO: radiowave/35782 on milkyway.fritz.box: load XEP-0030: Service Discovery (widget_type=disco)
...
```

# Author

 * Christoph Hartmann <chris@lollyrock.com>

# License

Copyright 2013 - 2015 Christoph Hartmann

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
