module.exports = function (room) {

    var json = room.toJSON();
    json.url = "http://localhost:9030/api/rooms/"+room.getOwner() + "/" + room.getName();
    return json;
};