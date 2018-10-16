#!/bin/sh
while :
do
git pull
mvn clean package -Dmaven.test.skip=true -U
java -jar target/paperbots.jar -s ../client/
done
