# Paperbots Docker
This directory contains everything necessary to start a Paperbots instance in a Docker container.

The `docker-compose.yml` defines all containers necessary for an instance:

* paperbots_nginx: an Nginx instance serving as a proxy in front of the Java server. See the `nginx.conf` file for its configuration. Logs will be persisted to volume mapping to `data/logs/`
* paperbots_mysql: a MySQL instance. Data will be persisted to a volume mapping to `data/mysql/`
* paperbots_site: the container running the Java server.

Before you can run Paperbots via Docker, do the following:

* Add the missing values for email settings and database user to the `.env` file.
* Create a network called `nginx-proxy`

You can then start all containers via

```
docker-compose up -d
```

To stop the containers run

```
docker-compose down
```

To view the logs run

```
docker-compose logs -f
```
