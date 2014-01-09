# Changelog

## 0.2.0

* feature: Roaster support
* feature: Xep-0045 support
* feature: Xep-0307 support
* feature: Xep-0060 support
* feature: Xep-0199 support
* feature: Xep-0092 support
* feature: generate javascript files with features from xml files
* feature: export module functionality
* feature: export module functionality
* feature: implement rfc 3921 messaging tests
* feature: add test for roaster stanza handling
* feature: add test case for roaster storage
* feature: generate a tis certificate and use it for c2s connections
* feature: initial vcard version
* improvement: store roaster entries properly with owner
* improvement: muc uses lookup table
* improvement: pubsub uses lookup table
* improvement: separate logger for pub sub
* improvement: auto-create database schema for pub sub
* improvement: auto-create database schema for roaster
* improvement: run init method at startup
* improvement: better console output
* improvement: add publish tests and fix the implementation
* improvement: update package.json dependencies
* improvement: make log levels configurable
* improvement: add test for ping and version
* improvement: make users editable
* bugfix: update channel tests
* bugfix: set proper storage path for postgre auto-schema-generation
* bugfix: works with names without #
* bugfix: proper handling of unsubscribe pub sub
* bugfix: xepcomponent is exported and roaster does not crash with empty list
* bugfix: update tests to new logger log level configuration
* bugfix: fix all issues in roaster store