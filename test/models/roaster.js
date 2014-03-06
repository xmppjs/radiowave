var uuid = require('node-uuid');
var assert = require('assert');
var Sequelize = require('sequelize');
var databaseModels = require('../../storage/models');

describe('Model', function () {

    var db = null;

    before(function (done) {

        var sequelize = new Sequelize('database', 'username', 'password', {
            dialect: 'sqlite',
            storage: './database.sqlite'
        });

        // load the database model
        console.log('load database');
        db = databaseModels(sequelize);

        // sync model
        console.log('sync database models');
        sequelize.sync({
            force: true
        })
            .complete(function (err) {
                console.log('test');
                done(err);
            });
    });

    describe('User', function () {

        it('create users', function (done) {

            db.User.bulkCreate([{
                jid: 'john@example.net',
                name: 'John Doe'
            }, {
                jid: 'alice@example.net',
                name: "Alice"
            }, {
                jid: 'bob@example.net',
                name: 'Bob'
            }]).success(function (user) {
                // cool users are there
                done();
            }).error(function (err) {
                done(err);
            });

        });

        it('john adds alice to the roaster', function (done) {

            db.User.find({
                where: {
                    jid: 'john@example.net'
                }
            }).success(function (john) {

                db.User.find({
                    where: {
                        jid: 'alice@example.net'
                    }
                }).success(function (alice) {

                    john.addRoaster(alice, {name: 'ms. a', group: 'friends', subscription: 'none'}).success(function(){
                        done();
                    });
                });


            }).error(function (err) {
                done(err);
            });

        });
    });
});