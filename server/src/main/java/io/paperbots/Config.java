package io.paperbots;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.Optional;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Config {
    private final String reloadPwd;
    private final String emailPwd;
    private final Db db;

    @JsonCreator
    public Config(String reloadPwd, String emailPwd, Db db) {
        this.reloadPwd = Optional.ofNullable(reloadPwd).orElseThrow(() -> new AssertionError("reload password configuration missing"));
        this.emailPwd = Optional.ofNullable(emailPwd).orElseThrow(() -> new AssertionError("email password configuration missing"));
        this.db = db;
    }

    public Db getDb() {
        return db;
    }

    public String getReloadPwd() {
        return reloadPwd;
    }

    public String getEmailPwd() {
        return emailPwd;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Db {
        private final String url;
        private final String user;
        private final String password;

        @JsonCreator
        public Db(final String url, final String user, final String password) {
            this.url = Optional.ofNullable(url).orElse("jdbc:mysql://127.0.0.1/paperbots");
            this.user = Optional.ofNullable(user).orElseThrow(() -> new AssertionError("db user configuration missing"));
            this.password = Optional.ofNullable(password).orElseThrow(() -> new AssertionError("db password configuration missing"));
        }

        public String getUrl() {
            return url;
        }

        public String getUser() {
            return user;
        }

        public String getPassword() {
            return password;
        }
    }

    public static final class EnvConfigurer {
        private EnvConfigurer() {
        }

        public static Config create() {
            return new Config(
                    System.getenv("PAPERBOTS_RELOAD_PWD"), System.getenv("PAPERBOTS_EMAIL_PWD"),
                    new Db(System.getenv("PAPERBOTS_DB_HOST"), "root", System.getenv("PAPERBOTS_DB_PWD")));
        }
    }

    public static final class FileConfigurer {
        private FileConfigurer() {
        }

        public static Config load(final File configFile) {
            try {
                return new ObjectMapper().readValue(configFile, Config.class);
            } catch (IOException e) {
                throw new IllegalStateException("Could not configure from file: " + configFile.getAbsolutePath(), e);
            }
        }
    }
}
