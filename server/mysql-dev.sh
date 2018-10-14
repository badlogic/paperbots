#!/bin/sh
docker run -d --name paperbots_mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123 -e MYSQL_DATABASE=paperbots mysql:5.7.23
