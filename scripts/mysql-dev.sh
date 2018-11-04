#!/bin/sh
docker container stop paperbots_mysql_dev
docker container rm paperbots_mysql_dev
docker run -d --name paperbots_mysql_dev -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123 -e MYSQL_DATABASE=paperbots mysql:5.7.23
