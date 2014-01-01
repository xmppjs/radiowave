# Rooms

## List all public rooms

    GET /rooms

## List rooms for the authenticated user.
    
    GET /user/rooms

## List public rooms for the specified user.

    GET /users/:user/rooms

## List organization rooms
    
    GET /orgs/:org/rooms

## Delete a room (requires admin access)

Create a new rooms for the authenticated user.

    POST /user/rooms 

Create a new rooms in this organization.

     POST /orgs/:org/rooms

### Input

Name | Type | Description
-----|------|-------------
`name`|`string` | **Required**. The name of the room.

```json
{
    "name" : "hello-world",
    "description" : "this is your first room"ß
}

```

## Get room

    GET /rooms/:owner/:room

## Edit room

    PATCH /rooms/:owner/:room

## Delete a room (requires admin access)

    DELETE /rooms/:owner/:room


