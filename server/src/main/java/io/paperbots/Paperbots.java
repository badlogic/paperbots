
package io.paperbots;

import java.io.File;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;

import com.esotericsoftware.minlog.Log;

import io.javalin.Javalin;
import io.javalin.embeddedserver.Location;
import io.javalin.embeddedserver.jetty.websocket.WebSocketHandler;
import io.javalin.embeddedserver.jetty.websocket.WsSession;
import io.marioslab.basis.arguments.Argument;
import io.marioslab.basis.arguments.ArgumentWithValue.StringArgument;
import io.marioslab.basis.arguments.Arguments;
import io.marioslab.basis.arguments.Arguments.ParsedArguments;
import io.marioslab.basis.site.FileWatcher;
import io.marioslab.basis.template.TemplateContext;
import io.paperbots.PaperbotsException.PaperbotsError;
import io.paperbots.data.SignupRequest;
import io.paperbots.data.User;
import io.paperbots.data.UserType;

/**
 * <p>
 * For this to run, you need to set 3 environment variables.
 *
 * <ul>
 * <li>PAPERBOTS_RELOAD_PWD: the password used when requesting a static file or server reload.</li>
 * <li>PAPERBOTS_DB_PWD: the password of the MySQL database running on localhost:3306.</li>
 * <li>PAPERBOTS_EMAIL_PWD: the password used to send verification emails via contact@paperbots.io.</li>
 * </ul>
 */
public class Paperbots {
	public static final String PAPERBOTS_RELOAD_PWD;
	public static final String PAPERBOTS_DB_PWD;
	public static final String PAPERBOTS_EMAIL_PWD;

	static {
		PAPERBOTS_RELOAD_PWD = System.getenv("PAPERBOTS_RELOAD_PWD");
		if (PAPERBOTS_RELOAD_PWD == null)
			throw new IllegalStateException("PAPERBOTS_RELOAD_PWD environment variable does not exist.");
		PAPERBOTS_DB_PWD = System.getenv("PAPERBOTS_DB_PWD");
		if (PAPERBOTS_DB_PWD == null) throw new IllegalStateException("PAPERBOTS_DB_PWD environment variable  does not exist.");
		PAPERBOTS_EMAIL_PWD = System.getenv("PAPERBOTS_EMAIL_PWD");
		if (PAPERBOTS_EMAIL_PWD == null)
			throw new IllegalStateException("PAPERBOTS_EMAIL_PWD environment variable does not exist.");
	}

	public static void main (String[] cliArgs) {
		Arguments args = new Arguments();
		StringArgument staticFilesArg = args.addArgument(new StringArgument("-s", "Static files directory.", "<dir>", false));
		Argument reloadArg = args.addArgument(new Argument("-r",
			"Whether to tell any browser websocket clients to\nreload the site when the output was\nre-generated", true));

		try {
			ParsedArguments parsed = args.parse(cliArgs);
			byte[] password = PAPERBOTS_RELOAD_PWD.getBytes("UTF-8");
			File staticFiles = new File(parsed.getValue(staticFilesArg));
			if (!staticFiles.exists())
				throw new RuntimeException("Static file directory '" + staticFiles.getPath() + "' does not exist.");

			Jdbi jdbi = setupDatabase();
			Emails emails = new Emails.JavaxEmails(PAPERBOTS_EMAIL_PWD);
			Paperbots paperbots = new Paperbots(jdbi, emails);
			setupEndpoints(paperbots, staticFiles, parsed.has(reloadArg), password);
		} catch (Throwable e) {
			Log.error(e.getMessage());
			Log.debug("Exception", e);
			args.printHelp(System.out);
			System.exit(-1);
			return; // never reached
		}
	}

	public static Jdbi setupDatabase () {
		Properties properties = new Properties();
		properties.setProperty("user", "root");
		properties.setProperty("password", PAPERBOTS_DB_PWD);
		properties.setProperty("useSSL", "false");
		return Jdbi.create("jdbc:mysql://localhost/paperbots", properties);
	}

	private static void setupEndpoints (Paperbots paperbots, File staticFiles, boolean enableReloading, byte[] reloadPassword) {
		Javalin app = Javalin.create().enableDynamicGzip().enableStaticFiles(staticFiles.getAbsolutePath(), Location.EXTERNAL)
			.port(8001).start();

		if (enableReloading) {
			final Map<WebSocketHandler, WsSession> wsClients = new ConcurrentHashMap<>();
			Thread generatorThread = new Thread((Runnable) () -> {
				try {
					FileWatcher.watch(staticFiles, () -> {
						for (WsSession session : wsClients.values()) {
							Log.info("Static content changed, telling websocket clients. Hello.");
							session.send("Reload");
						}
					});
				} catch (Throwable t) {
					Log.error(t.getMessage());
					Log.debug("Exception", t);
				}
			});
			generatorThread.setDaemon(true);
			generatorThread.start();

			app.ws("/api/reloadws", ws -> {
				Log.info("Setting up WebSocket reloading");

				ws.onConnect(session -> {
					Log.info("WebSocket client connected");
					wsClients.put(ws, session);
				});

				ws.onClose( (session, statusCode, reason) -> {
					Log.info("WebSocket client disconnected");
					wsClients.remove(ws);
				});

				ws.onError( (session, throwable) -> {
					Log.info("WebSocket client disconnected");
					wsClients.remove(ws);
				});
			});
		}

		app.post("/api/reloadstatic", ctx -> {
			String pwd = ctx.formParam("password");
			if (MessageDigest.isEqual(pwd.getBytes(), reloadPassword)) {
				new ProcessBuilder().command("git", "pull").start();
				Log.info("Got new static content.");
				ctx.response().getWriter().println("OK.");
			}
		});

		app.post("/api/reload", ctx -> {
			String pwd = ctx.formParam("password");
			if (MessageDigest.isEqual(pwd.getBytes(), reloadPassword)) {
				ctx.response().getWriter().println("OK.");
				ctx.response().getWriter().flush();
				Log.info("Got an update. Shutting down.");
				System.exit(-1);
			}
		});

		app.post("/api/signup", ctx -> {
			ctx.bodyAsClass(SignupRequest.class);
		});
	}

	private final Emails emails;
	private final Jdbi jdbi;

	public Paperbots (Jdbi jdbi, Emails emails) {
		this.jdbi = jdbi;
		this.emails = emails;
	}

	public void signup (String name, String email, UserType type) {
		if (name == null) throw new PaperbotsException(PaperbotsError.InvalidArgument, "User name must not be null.");
		if (name.trim().length() == 0) throw new PaperbotsException(PaperbotsError.InvalidArgument, "User name must not be empty.");
		if (email == null) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Email must not be null.");
		if (email.trim().length() == 0) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Email must not be empty.");

		final String verifiedEmail = email.trim();
		final String verifiedName = name.trim();

		jdbi.withHandle(handle -> {
			// TODO this should be done in a transaction

			// Check if user exists
			try {
				User user = handle.createQuery("SELECT id, name FROM users WHERE email=:email").bind("email", verifiedEmail)
					.mapToBean(User.class).findOnly();
				sendCode(handle, user.getId(), user.getName(), verifiedEmail);
				return null;
			} catch (IllegalStateException t) {
				// Fall through, user does not yet exist.
			}

			// Insert user and send verification email
			try {
				int id = handle.createUpdate("insert into users (name, email, type) value (:name, :email, :type)")
					.bind("name", verifiedName).bind("email", verifiedEmail).bind("type", type).executeAndReturnGeneratedKeys("id")
					.mapTo(Integer.class).findOnly();
				Log.info("Created user " + verifiedName);
				sendCode(handle, id, verifiedName, verifiedEmail);
			} catch (IllegalStateException t) {
				throw new PaperbotsException(PaperbotsError.ServerError, t);
			}
			return null;
		});
	}

	private void sendCode (Handle handle, int userId, String name, String email) {
		// Check if we've send an email in the last 10 minutes, and if so, do nothing.
		try {
			int id = handle
				.createQuery("select userId from userCodes where userId=:userId and created > DATE_SUB(NOW(), INTERVAL 10 MINUTE)")
				.bind("userId", userId).mapTo(Integer.class).findOnly();
			if (id == userId) return;
		} catch (IllegalStateException e) {
			// Fall through, generate new code and send email.
		}

		String code = generateId(5);
		if (handle.createUpdate("insert into userCodes (userId, code) value (:userId, :code)").bind("userId", userId)
			.bind("code", code).execute() != 1) {
			throw new PaperbotsException(PaperbotsError.CouldNotCreateCode);
		}
		String message = Templates.SIGNUP.render(new TemplateContext().set("name", name).set("code", code));
		emails.send(email, "Paperbots magic code", message);
	}

	public String verifyCode (String code) {
		if (code == null) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Code must not be null.");
		if (code.trim().length() == 0) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Code must not be empty.");

		final String verifiedCode = code.trim();
		return jdbi.withHandle(handle -> {
			int userId = 0;
			try {
				userId = handle.createQuery("select userId from userCodes where code=:code").bind("code", verifiedCode)
					.mapTo(Integer.class).findOnly();
			} catch (IllegalStateException e) {
				throw new PaperbotsException(PaperbotsError.CouldNotVerifyCode, e);
			}

			handle.createUpdate("delete from userCodes where code=:code and userId=:userId").bind("code", verifiedCode)
				.bind("userId", userId).execute();

			String token = generateId(32);
			if (handle.createUpdate("insert into userTokens (userId, token) value (:userId, :token)").bind("userId", userId)
				.bind("token", token).execute() != 1) {
				throw new PaperbotsException(PaperbotsError.CouldNotVerifyCode);
			}
			return token;
		});
	}

	private static char[] _base62chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();
	private static SecureRandom random = new SecureRandom();

	private static String generateId (int length) {
		StringBuilder sb = new StringBuilder(length);
		for (int i = 0; i < length; i++)
			sb.append(_base62chars[random.nextInt(62)]);
		return sb.toString();
	}
}
