
package io.paperbots;

import static org.junit.Assert.assertEquals;

import java.io.File;
import java.io.IOException;

import org.apache.http.ParseException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runners.MethodSorters;
import org.testcontainers.containers.MySQLContainer;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.paperbots.PaperbotsException.PaperbotsError;
import io.paperbots.Server.ErrorResponse;
import io.paperbots.Server.SignupRequest;
import io.paperbots.Server.VerifyRequest;

@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class ServerTest {
	private static Server server;
	private static TestEmails emails = new TestEmails();

	@ClassRule public static MySQLContainer mysql = new MySQLContainer().withDatabaseName("paperbots");

	@BeforeClass
	public static void setup () {
		final Config.DatabaseConfig config = new Config.DatabaseConfig(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
		server = new Server(new Paperbots(Database.setupDatabase(config, true), emails), false, new File("../client"));
	}

	@AfterClass
	public static void tearDown () {
		server.stop();
	}

	@Test
	public void test_00_Signup () throws JsonParseException, JsonMappingException, ParseException, IOException {
		// Sign up
		post("http://localhost:8001/api/signup", new SignupRequest("badlogic", "badlogicgames@gmail.com"), Void.class);

		// Retrieve code sent via email
		String code = emails.getMessage().split("\n")[5];

		// Try to sign up with the same user name or email, should fail
		try {
			post("http://localhost:8001/api/signup", new SignupRequest("badlogic", "badlogicgames@gmail.com"), Void.class);
		} catch (ErrorResponseException e) {
			assertEquals(PaperbotsError.UserExists, e.response.error);
		}

		// Verify the code we got via email and retrieve a token
		post("http://localhost:8001/api/verify", new VerifyRequest(code), Void.class);

		// Check how we handle exceptions
		try {
			post("http://localhost:8001/api/exception", new VerifyRequest(code), Void.class);
		} catch (ErrorResponseException e) {
			assertEquals(PaperbotsError.ServerError, e.response.error);
		}
	}

	public static <REQ, RES> RES post (String url, REQ request, Class<RES> clazz) throws JsonParseException, JsonMappingException, ParseException, IOException {
		CloseableHttpClient client = HttpClients.createDefault();
		HttpPost httpPost = new HttpPost(url);

		ObjectMapper json = new ObjectMapper();
		StringEntity entity = new StringEntity(json.writeValueAsString(request));
		httpPost.setEntity(entity);
		httpPost.setHeader("Accept", "application/json");
		httpPost.setHeader("Content-type", "application/json");

		try {
			CloseableHttpResponse response = client.execute(httpPost);
			if (response.getStatusLine().getStatusCode() != 200) {
				String r = EntityUtils.toString(response.getEntity());
				throw new ErrorResponseException(json.readValue(r, ErrorResponse.class));
			}
			if (clazz == Void.class)
				return null;
			else {
				String r = EntityUtils.toString(response.getEntity());
				return json.readValue(r, clazz);
			}
		} finally {
			client.close();
		}
	}

	public static class ErrorResponseException extends RuntimeException {
		public final ErrorResponse response;

		public ErrorResponseException (ErrorResponse response) {
			super();
			this.response = response;
		}
	}
}
