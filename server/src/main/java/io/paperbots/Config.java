
package io.paperbots;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.Optional;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Config {
	private final String reloadPassword;
	private final EmailConfig emailConfig;
	private final DatabaseConfig databaseConfig;

	@JsonCreator
	public Config (@JsonProperty("reloadPassword") String reloadPassword, @JsonProperty("emailConfig") EmailConfig emailConfig,
		@JsonProperty("databaseConfig") DatabaseConfig databaseConfig) {
		this.reloadPassword = Optional.ofNullable(reloadPassword).orElseThrow( () -> new AssertionError("Reload password configuration missing"));
		this.emailConfig = emailConfig;
		this.databaseConfig = databaseConfig;
	}

	public EmailConfig getEmailConfig () {
		return emailConfig;
	}

	public DatabaseConfig getDatabaseConfig () {
		return databaseConfig;
	}

	public String getReloadPassword () {
		return reloadPassword;
	}

	public static Config fromFile (File configFile) {
		try {
			return new ObjectMapper().readValue(configFile, Config.class);
		} catch (IOException e) {
			throw new IllegalStateException("Could not configure from file: " + configFile.getAbsolutePath(), e);
		}
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public static class EmailConfig {
		private final String host;
		private final int port;
		private final String email;
		private final String password;

		public EmailConfig (@JsonProperty("host") String host, @JsonProperty("port") Integer port, @JsonProperty("email") String email,
			@JsonProperty("password") String password) {
			this.host = Optional.ofNullable(host).orElseThrow( () -> new IllegalArgumentException("SMTP host is missing."));
			this.port = Optional.ofNullable(port).orElseThrow( () -> new IllegalArgumentException("SMTP port is missing."));
			this.email = Optional.ofNullable(email).orElseThrow( () -> new IllegalArgumentException("Email address is missing."));
			this.password = Optional.ofNullable(password).orElseThrow( () -> new IllegalArgumentException("Email password is missing."));
		}

		public String getHost () {
			return host;
		}

		public int getPort () {
			return port;
		}

		public String getEmail () {
			return email;
		}

		public String getPassword () {
			return password;
		}
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public static class DatabaseConfig {
		private final String jdbcUrl;
		private final String user;
		private final String password;

		@JsonCreator
		public DatabaseConfig (@JsonProperty("jdbcUrl") String jdbcUrl, @JsonProperty("user") String user, @JsonProperty("password") final String password) {
			this.jdbcUrl = Optional.ofNullable(jdbcUrl).orElseThrow( () -> new IllegalArgumentException("Database JDBC URL is missing."));
			this.user = Optional.ofNullable(user).orElseThrow( () -> new IllegalArgumentException("Database user is missing."));
			this.password = Optional.ofNullable(password).orElseThrow( () -> new IllegalArgumentException("Database password is missing."));
		}

		public String getJdbcUrl () {
			return jdbcUrl;
		}

		public String getUser () {
			return user;
		}

		public String getPassword () {
			return password;
		}
	}
}
