# Users API

    var user = Users.user(username);
    user.addEmail(email, callback);
    user.removeEmail(email, callback);
    user.listEmails(callback);

# Rooms API

    var user = Users.user(username);
    user.rooms(callback);
    var room = user.createRoom(room, callback);
    var room = user.getRoom(room); // creates stub object

    // get specific rooms
    // var room = Rooms.room(username, roomname); // creates stub object
    // Rooms.findRoom(id, callback);
    // room.remove(callback);

## Members API

    room.listMembers(parameters, callback);
    room.addMember(member, callback);
    room.removeMember(id, callback);
    room.editMember(member, callback)

## Messages API

    room.listMessages(parameters, callback);
    room.createMessage(message, callback);
    room.getMessage(id, callback);
    room.editMessage(message, callback);
    room.removeMessage(id, callback);

## Hooks API (optional)

    room.listHooks(parameters, callback);
    room.createHook(options, callback);
    room.getHook(id, callback);
    room.editHook(options, callback);
    room.removeHook(id, callback);

# Channel API

    var user = Users.user(username);
    user.channels(callback);
    user.createChannel(channel, callback);
    var channel = user.getChannel(channelname); // creates stub object

    // get specific channel
    var channel = Channel.channel(username, channelname); // creates stub object
    channel.remove(callback);

## Subscribers API

    channel.subscribe(user);
    channel.unsubscribe(user);
    channel.listSubscribers(parameters, callback);

## Event API

    channel.trigger(event, callback);
    channel.getEvents(parameters, callback);

## Hooks API (optional)

    channel.listHooks(parameters, callback);
    channel.createHook(options, callback);
    channel.getHook(id, callback);
    channel.editHook(options, callback);
    channel.removeHook(id, callback);


# Map xmpp and rest to storage 

The `xRocket Global Identifier` will be used to store the data. Data is always stored with the owner. Therefore the REST API fits very well our storage approach.

## Pubsub

 - `XMPP Identifier`: `pubsub.example.com/:nodeid`, nodeid is globally unique at `pubsub.example.com`
 - `REST Identifier`: `example.com/api/channels/:owner/:nodename`, combination of owner and nodename is globally unique

romeo@example.com creats new `channel01` via xmpp. The identifiers are as follows:

 - `XMPP Identifier`: channel01
 - `REST Identifier`: romeo/channel01
 - `XGI Identifier `: romeo/channel01

If julia@example.com creats new `channel01` via xmpp an error will be thrown. Still, Juila can create a channel via api /juila/room01:

 - `XMPP Identifier`: uuid
 - `REST Identifier`: julia/channel01
 - `XGI Identifier `: julia/channel01 (channel01 would not be unique across the server)

We do not use `julia/room01` as xmpp identifier, because this would not work with the URI schema for jids: `juila/room01@chat.example.com` is not valid.

## Muc
 - `XMPP Identifier`: `roomid@chat.example.com`, roomid is globally unique at `chat.example.com`
 - `REST Identifier`: `example.com/api/rooms/:owner/:roomname`, combination of owner and roomname is globally unique

romeo@example.com creats new `room01` via xmpp. The identifiers are as follows:

 - `XMPP Identifier`: room01
 - `REST Identifier`: romeo/room01
 - `XGI Identifier `: romeo/room01

If julia@example.com creats new `room01` via xmpp an error will be thrown. Still, Juila can create a room via api /juila/room01:

 - `XMPP Identifier`: uuid
 - `REST Identifier`: julia/room01
 - `XGI Identifier `: julia/room01 (room01 would not be unique across the server)

We do not use `julia/room01` as xmpp identifier, because this would not work with the URI schema for jids: `juila/room01@chat.example.com` is not valid.

