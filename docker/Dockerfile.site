FROM openjdk:10-jdk-slim

WORKDIR /

# Curl, git, etc
RUN apt-get update && apt-get -y --force-yes install git maven && \
 	git clone https://github.com/badlogic/paperbots && \
	cd /paperbots/server && mvn clean package -Dmaven.test.skip=true -DskipTests

CMD cd /paperbots/scripts && ./start.sh