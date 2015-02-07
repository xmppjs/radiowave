# Changelog

## 0.6.2

* clean up old test code
* feature: emit events for room create, update and delete
* return creation date for room json

## 0.6.1

* stop using git flow
* update node-xmpp and pg dependencies
* simplify json api helper
* bugfix: return rooms with members

## 0.6.0

* upgrade to sequelize 2.0
* upgrade to latest express 4
* deactivate storage of pubsub messages
* optimize json export
* restructure folder structure
* fix all jshint issues
* use 2 space intend instead of 4
* fix all test case with latest upgrades
* implement all database actions with transactions

## 0.5.2

* update engine.io

## 0.5.1

* improve logging

## 0.5.0 

* take care: breaking api changes
* support for engine.io
* switch to express 4.0
* harmonized components and modules
* implement support for mediated invitations
* improvement: overhaul of the core eventing model
* feature: implemented star router
* harmonize methods between xmpp calls and api calls

## 0.4.2

* complete rewrite of storage module with sequelize

## 0.4.1

* more muc features
* upgraded node-xmpp version

## 0.4.0

* refactureing of folder structure

## 0.3.0

* feature: added Oauth and LDAP authentication mechanism
* switch to bluebird promise library
* various api bug fixes

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