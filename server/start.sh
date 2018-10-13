#!/bin/sh
while :
do
git pull
mvn clean package -U
java -jar target/paperbots.jar -s ../client/ -p $PAPERBOTS_PWD
done
