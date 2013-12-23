# xRocket

xRocket is a lightweight xmpp server that is made for the web:

 - easy deployment on cloud platforms
 - fast
 - simple to configure

## Setup

    export DATABASE_URL=postgres://postgres:password@localhost/database
    foreman start

## Features & Roadmap

✔ supported, ∅ partially supported by xRocket, ✘ not supported by xRocket (yet)
         
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
| XMPP Security    |||
| [XEP-0077: In-band Registration](http://xmpp.org/extensions/xep-0077.html)  | For account creators | ✘ |
| [XEP-0158: CAPTCHA Forms](http://xmpp.org/extensions/xep-0158.html)  | Prevent bots | ✘ |
| [XEP-0205: Best Practices to Discourage Denial of Service Attacks](http://xmpp.org/extensions/xep-0205.html) | Prevent denial of service attacks | ✘ |

# Author

 * Christoph Hartmann <chris@lollyrock.com>

# License

Copyright 2013 Christoph Hartmann

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.