# Deployment Service

Service responsible for providing services regarding the "services" data model.  

## Live version

There's a live version of this service deployed to heroku and using a mongodb atlas cluster.

NOTE that service may delay to respond first time due to limitations of free tiers of heroku and mongodb atlas

You can make requests against this url:
- https://liferay-deployment-service.herokuapp.com

This version has the following available users:

```text
  - liferay-admin / qwe!@£
  - liferay-contributor / abc321@
  - liferay-guest / guest@liferay
```

## Available Endpoints

### Login - must be done before accessing any route (except healthcheck)

Request:
```shell
curl --location --request POST 'https://liferay-deployment-service.herokuapp.com/v1/sessions/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username": "liferay-guest",
    "password": "guest@liferay"
}'
```

Response:

```json
{
    "message": "Success",
    "timestamp": "1640298532660",
    "transactionId": "878a4af1-ab79-453d-945b-b0a9eaf7226a",
    "response": {
        "token": "Bearer eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJyZWYiOiJhN2ZjZTVjYy1jNTFjLTQ0NDEtYjhhMC05NjIyMjkwNmM3ODIiLCJpYXQiOjE2NDAyOTg1MzIsImV4cCI6MTY0MDM4NDkzMiwiaXNzIjoiZHBzIiwic3ViIjoiMzdiYTI4MDQtZWFlMC00ZGNjLTliOTItZWI3ZWY2Zjc0NDRlIn0.VbAlKyopRugQxEUo7b8yW7lhNbyiE84T_06BbpAWHCN1mONhqtmhFNnmUmO9XeiY1P0CXzzbhcFc__i-JUthGrbt8u3TqoRqoShPdVU_651zHgJDQ7FrlNRJQAJ5KhipouoVvD2FvncVdO15FV5Nn9-tnUJ_cIpMLtEHfT4X6rrzcZBugYqLiT7YTUcZAfk9VM2gd_-tZWDO78scTFgWsQjnNxLRQb-____ibCovaE-OaV4V3cxCWz-Tf-QsNDsPorQjzGYDH6lpqbimjdh7PaNWGWS4vfdyMHmdnYrYsGv3p4bTZIsOr8rf6EF3LOTa1vGog4bn8NkNqoALK5-6vSHL7vlIMrFkMfxnBvkwU7Kgh_vav4p61uGZRmuftdzchlIjVFonSSTqgAntZtQBZOYFsvCYHnY7RV_-eE47umrrHClnUGydu4lWm_32TqCNatYXU-kDYhFyhuGPV54MUUoRTvasjXC__8sUw4OtMzbnQzEAP3xohZcsY7JXfKKwy1UsUs2FnDLinsDe_Fquh6DrxFH1Tq_ZeceOyMgm-euAzJQvPaIG5d-qImaZJEgMO2rou9AxhBBPFPNWH8mZhVShB1yceEzFU89TSgxWVxbmyoIRJqyabXfWwSliS2LnfcMpxMHF9FqJpvH_EdpiXRVfPiWRuQJPnZuAiYLMRCY",
        "expiration": "1640384932"
    }
}
```

### Logout

Request:
```shell
curl --location --request POST 'https://liferay-deployment-service.herokuapp.com/v1/sessions/logout' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

Response:
```json
{
    "message": "Success",
    "timestamp": "1640290039702",
    "transactionId": "a7ac4b9e-7e2a-417b-9e65-48b10496fc7a"
}
```

### Create Service

Request:
```shell
curl --location --request POST 'https://liferay-deployment-service.herokuapp.com/v1/services' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "id": "561a5c0b-a58f-45fe-b133-d0dc85547e98",
  "image": "liferay/portal@latest",
  "createdAt": "1640298322",
  "type": "Deployment",
  "cpu": 1,
  "memory": 1024
}'
```

Response:

```json
{
    "message": "Success",
    "timestamp": "1640298593596",
    "transactionId": "bd1224c1-1f55-4048-b247-5ee5fcdcfb53",
    "response": {
        "id": "561a5c0b-a58f-45fe-b133-d0dc85547e98"
    }
}
```

### Deploy a service

Request:
```shell
curl --location --request POST 'https://liferay-deployment-service.herokuapp.com/v1/services/deploy/757630a8-5f43-424a-bc53-89b3e3a89cd2' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

Response:

```json
{
    "message": "Success",
    "timestamp": "1640298540928",
    "transactionId": "8bce3cd4-2bc9-43c6-857d-35b788164ad3",
    "response": {
        "status": "Deployment scheduled"
    }
}
```

### Get a service by id

Request:
```shell
curl --location --request GET 'https://liferay-deployment-service.herokuapp.com/v1/services/757630a8-5f43-424a-bc53-89b3e3a89cd2' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

Response:

```json
{
    "message": "Success",
    "timestamp": "1640298740684",
    "transactionId": "757630a8-5f43-424a-bc53-89b3e3a89cd2",
    "response": {
        "id": "561a5c0b-a58f-45fe-b133-d0dc85547e98",
        "image": "liferay/portal@latest",
        "createdAt": "1640298322",
        "type": "Deployment",
        "cpu": 1,
        "memory": 1024,
        "deploymentStatus": "RUNNING"
    }
}
```

### Get All Services

Request:
- query param (sort - available values: CREATION_TIME, IMAGE)
```shell
curl --location --request GET 'https://liferay-deployment-service.herokuapp.com/v1/services?sort=CREATION_TIME' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

Response:

```json
{
    "message": "Success",
    "timestamp": "1640298881978",
    "transactionId": "aa744e8c-74ff-45be-9328-12f796f9ed3f",
    "response": [
        {
          "id": "561a5c0b-a58f-45fe-b133-d0dc85547e98",
          "image": "liferay/portal@latest",
          "createdAt": "1640298322",
          "type": "Deployment",
          "cpu": 1,
          "memory": 1024
        },
        {
            "id": "f2d81924-6132-4403-89a4-facc719eb395",
            "image": "liferay/portal@lv3",
            "createdAt": "1640298322",
            "type": "StatefulSet",
            "cpu": 3,
            "memory": 2048
        }
    ]
}
```

### Healthcheck

Request:
```shell
curl --location --request GET 'https://liferay-deployment-service.herokuapp.com/v1/healthcheck'
```

Response:
```json
{
    "message": "Success",
    "timestamp": "1640298999663",
    "transactionId": "b52f0446-16a1-4e59-8eb7-b9dc55dfcddb",
    "response": {
        "message": "Service running"
    }
}
```

## Running Locally

There are few steps that must be executed before running the app locally

## Know the Environment Variables available

Here's the list of environment variables that must be set prior to running the service:

- MONGO_URI: Uri to connect to mongodb, eg: `mongodb://user:password@localhost:27017/deployment-service`
- MONGO_DATABASE: The database name in mongodb, eg: `deployment-service`
- JWT_TOKEN_PRIVATE_KEY: A base 64 encoded private RSA and PEM key suitable for RS512 signing algorithm
- JWT_TOKEN_PUBLIC_KEY: The public key

Key pair can be generated by running following command:
```shell
ssh-keygen -t rsa -b 4096 -m PEM -f private.key
cat private.key | base64 -w 0
cat private.key.pub | base64 -w 0
```

## Start a mongodb database instance

That can be done using mongobd official docker image (requires docker installed):
- NOTE that the parameters provided in the example match the ones specified in `.env` file
```shell
docker run -d -p 27017:27017 --name deployment-service-mongo \
    -e MONGO_INITDB_ROOT_USERNAME=dps \
    -e MONGO_INITDB_ROOT_PASSWORD=dpsstrongpassword \
    -e MONGO_INITDB_DATABASE=deployment-service \
    mongo
```

## Add users to the `users` collection of the database

List of credentials:

```text
  - liferay-admin / qwe!@£
  - liferay-contributor / abc321@
  - liferay-guest / guest@liferay
```

List of test users:
- NOTE that password is hashed using SHA256 hashing algorithm
- NOTE that user.status must be ACTIVE so it can be used

```shell
docker exec -it deployment-service-mongo sh
mongo --username dps --password dpsstrongpassword
use deployment-service
db.users.insertMany([{
    "_id": "67a2ffdb-3335-42d5-aac4-89da6445ce76",
    "username": "liferay-admin",
    "password": "0acee2efe961b3884e7f05b1f77a09995151c47325592eb02923802af6c5ceaf",
    "role": "ADMIN",
    "status": "ACTIVE"
},
{
    "_id": "56e2bd92-bbc0-4542-b86a-6030676285dd",
    "username": "liferay-contributor",
    "password": "c8503de25192d9217ab52b1171f51c2fc256aef5a6bb059d6aec3238e3481a23",
    "role": "CONTRIBUTOR",
    "status": "ACTIVE"
  },
  {
    "_id": "dbfa1fc7-5155-4d18-b4c6-64521f9c52f8",
    "username": "liferay-guest",
    "password": "b63e63632757901d0d0d2c7e0b40269ac3539b597ee6add1a786a9d48e9a61fe",
    "role": "GUEST",
    "status": "ACTIVE"
}]);
```

### Build (optionally test) and run the service

- Before running the service make sure the environment variables described have been updated on `.env` file

```shell
npm install
npm run build
npm run test
npm start
```

## Know the other collection schemas

### Collection `sessions` data example

```json
{
  "_id":"ba7edb0f-ec61-4f2b-b400-836217820dc7",
  "userId": "37ba2804-eae0-4dcc-9b92-eb7ef6f7444e",
  "status": "ACTIVE",
  "createdDate": "1640207399143",
  "expirationDate": "1640293799"
}
```

### Collection `services` data example

```json
{
  "_id": "5464646",
  "image": "img",
  "type": "Deployment",
  "createdAt": "1640298593562",
  "cpu": 1,
  "memory": 512
}
```
