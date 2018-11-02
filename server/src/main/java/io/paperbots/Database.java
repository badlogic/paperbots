
package io.paperbots;

import org.flywaydb.core.Flyway;
import org.jdbi.v3.core.Jdbi;

import java.util.Properties;

public class Database {
    public static Jdbi setupDatabase(Config.Db config, boolean test) {
        final Jdbi jdbi;

        Properties properties = new Properties();
        properties.setProperty("user", config.getUser());
        properties.setProperty("password", config.getPassword());
        properties.setProperty("useSSL", "false");
        properties.setProperty("useUnicode", "true");
        properties.setProperty("characterEncoding", "UTF-8");

        jdbi = Jdbi.create(config.getUrl(), properties);
        Flyway flyway = Flyway.configure().dataSource(config.getUrl(), config.getUser(), config.getPassword()).load();
        if (test) flyway.clean();
        flyway.migrate();

        return jdbi;
    }
}
