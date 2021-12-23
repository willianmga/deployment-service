#!/bin/bash

## Script for automating deployment of source code into Heroku

export DOCKER_HUB_REPO="willianmga"
export APPNAME="liferay-deployment-service"

export DOCKER_HUB_USERNAME="willianmga"
export USERNAME="willian.bodnariuc@gmail.com"

# Deploys docker image to Heroku

heroku login --username $USERNAME
export TOKEN=$(heroku auth:token)

echo
echo Using Heroku Auth token $TOKEN
echo

docker login --username=$USERNAME --password=$TOKEN registry.heroku.com || { echo 'Failed to login to heroku. Exiting.' ; exit 1; }
docker tag $APPNAME:latest registry.heroku.com/$APPNAME/web
docker push registry.heroku.com/$APPNAME/web || { echo 'Failed to push to heroku. Exiting.' ; exit 1; }

heroku container:release web --app $APPNAME || { echo 'Failed to deploy to heroku. Exiting.' ; exit 1; }
