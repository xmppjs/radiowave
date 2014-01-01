# Channels

## Create a new channels for the authenticated user.

    POST /user/channels 

## Create a new channels in this organization.

    POST /orgs/:org/channels 

## Get channel

    GET /channels/:owner/:channel/

## Edit channel

    PATCH /channels/:owner/:channel

## Delete a channel (requires admin access)

    DELETE /channels/:owner/:channel