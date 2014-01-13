module.exports = function (room) {
    room.url = "http://localhost:9020/api/rooms/"+room.getOwner() + "/" + room.getName();
    return room;
};