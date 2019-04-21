# backend
REST API backend for the Hatch app. This backend currently only handles authentication. The documentation for the REST API can be found on [swagger hub](https://app.swaggerhub.com/apis-docs/Yengas/hatch-rest/1.2).

## Auth Flow
The users are authenticated to the services using the auth service contained in this rest api. The auth service is responsible for creating anonymous and registered users, and giving JWT tokens for them. This JWT tokens are valid for only a given amount of time, and can be refreshed even after the token expires. However any action that modifies the user account (name, password change, register etc.) will make the previous token un-refreshable.

### User Open App Without Token
An anonymous user will be created for the user using `/auth/init`. The user can then use the `/auth/login` to authenticate with another account that he knows the credentials of.

### User Open App With Token
An `/auth/init` will sent, causing the token to be refreshed. The user can continue doing the normal operations.

### Anonymous Users
By default, `/auth/init` returns an unregistered user, that can be registered using `/auth/register` this will create an account with the given name and password. The name and password can be changed later `/auth/change`.

### Token Invalidation
Tokens expire after a some constant time. This will cause the REST API requests to respond with *403* in this case, the `/auth/refresh` should be called. If the `/auth/refresh` returns 200 the new token should be used for further requests, otherwise the user should either use `/auth/login` to re-login, or `/auth/init` to create a new account.
