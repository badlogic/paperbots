#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
cd $DIR/../server
while :
do
git pull
mvn clean package -Dmaven.test.skip=true -U
java -jar target/paperbots.jar -s ../client/site
done
