
package io.paperbots;

import java.io.File;
import java.security.SecureRandom;
import java.util.List;

import org.apache.commons.validator.routines.EmailValidator;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;

import com.esotericsoftware.minlog.Log;

import io.marioslab.basis.arguments.Argument;
import io.marioslab.basis.arguments.ArgumentWithValue.StringArgument;
import io.marioslab.basis.arguments.Arguments;
import io.marioslab.basis.arguments.Arguments.ParsedArguments;
import io.marioslab.basis.template.TemplateContext;
import io.paperbots.PaperbotsException.PaperbotsError;
import io.paperbots.data.Project;
import io.paperbots.data.ProjectType;
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
	public static final String PAPERBOTS_DB_HOST;
	public static final String PAPERBOTS_DB_PWD;
	public static final String PAPERBOTS_EMAIL_PWD;

	static {
		PAPERBOTS_RELOAD_PWD = System.getenv("PAPERBOTS_RELOAD_PWD");
		if (PAPERBOTS_RELOAD_PWD == null) throw new IllegalStateException("PAPERBOTS_RELOAD_PWD environment variable does not exist.");
		PAPERBOTS_DB_PWD = System.getenv("PAPERBOTS_DB_PWD");
		if (PAPERBOTS_DB_PWD == null) throw new IllegalStateException("PAPERBOTS_DB_PWD environment variable  does not exist.");
		PAPERBOTS_EMAIL_PWD = System.getenv("PAPERBOTS_EMAIL_PWD");
		if (PAPERBOTS_EMAIL_PWD == null) throw new IllegalStateException("PAPERBOTS_EMAIL_PWD environment variable does not exist.");

		if (System.getenv("PAPERBOTS_DB_HOST") == null)
			PAPERBOTS_DB_HOST = "127.0.0.1";
		else
			PAPERBOTS_DB_HOST = System.getenv("PAPERBOTS_DB_HOST");
	}

	public static void main (String[] cliArgs) {
		Arguments args = new Arguments();
		StringArgument staticFilesArg = args.addArgument(new StringArgument("-s", "Static files directory.", "<dir>", false));
		Argument reloadArg = args
			.addArgument(new Argument("-r", "Whether to tell any browser websocket clients to\nreload the site when the output was\nre-generated", true));

		try {
			ParsedArguments parsed = args.parse(cliArgs);
			File staticFiles = new File(parsed.getValue(staticFilesArg));

			Jdbi jdbi = Database.setupDatabase(false);
			Emails emails = new Emails.JavaxEmails(PAPERBOTS_EMAIL_PWD);
			Paperbots paperbots = new Paperbots(jdbi, emails);
			new Server(paperbots, parsed.has(reloadArg), staticFiles);
		} catch (Throwable e) {
			Log.error(e.getMessage());
			Log.debug("Exception", e);
			args.printHelp(System.out);
			System.exit(-1);
			return; // never reached
		}
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

		// Validate email so we don't create a db entry or send an email in vain.
		if (!EmailValidator.getInstance().isValid(verifiedEmail)) {
			throw new PaperbotsException(PaperbotsError.InvalidEmailAddress);
		}

		// Make sure the user name is 4-25 letters/digits only.
		if (verifiedName.length() < 4 || verifiedName.length() > 25) {
			throw new PaperbotsException(PaperbotsError.InvalidUserName);
		}
		for (int i = 0; i < verifiedName.length(); i++) {
			char c = verifiedName.charAt(i);
			if (!Character.isLetterOrDigit(c)) {
				throw new PaperbotsException(PaperbotsError.InvalidUserName);
			}
		}

		jdbi.withHandle(handle -> {
			// TODO this should be done in a transaction

			// Check if that name exists
			try {
				handle.createQuery("SELECT name FROM users WHERE name=:name").bind("name", verifiedName).mapTo(String.class).findOnly();
				throw new PaperbotsException(PaperbotsError.UserExists);
			} catch (IllegalStateException t) {
				// Fall through, name does not yet exist.
			}

			// Check if user exists
			try {
				User user = handle.createQuery("SELECT id, name FROM users WHERE email=:email").bind("email", verifiedEmail).mapToBean(User.class).findOnly();
				if (!verifiedName.equals(user.getName())) {
					throw new PaperbotsException(PaperbotsError.EmailExists);
				}
				sendCode(handle, user.getId(), user.getName(), verifiedEmail);
				return null;
			} catch (IllegalStateException t) {
				// Fall through, user does not yet exist.
			}

			// Insert user and send verification email
			try {
				handle.createUpdate("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'").execute();
				int id = handle.createUpdate("insert into users (name, email, type) value (:name, :email, :type)").bind("name", verifiedName)
					.bind("email", verifiedEmail).bind("type", type).executeAndReturnGeneratedKeys("id").mapTo(Integer.class).findOnly();
				Log.info("Created user " + verifiedName);
				sendCode(handle, id, verifiedName, verifiedEmail);
			} catch (IllegalStateException t) {
				throw new PaperbotsException(PaperbotsError.ServerError, t);
			}
			return null;
		});
	}

	public TokenAndName verifyCode (String code) {
		if (code == null) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Code must not be null.");
		if (code.trim().length() == 0) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Code must not be empty.");

		final String verifiedCode = code.trim();
		return jdbi.withHandle(handle -> {
			int userId = 0;
			try {
				userId = handle.createQuery("select userId from userCodes where code=:code").bind("code", verifiedCode).mapTo(Integer.class).findOnly();
			} catch (IllegalStateException e) {
				throw new PaperbotsException(PaperbotsError.CouldNotVerifyCode, e);
			}

			// Delete ALL old user codes!
			handle.createUpdate("delete from userCodes where userId=:userId").bind("code", verifiedCode).bind("userId", userId).execute();

			String token = generateId(32);
			if (handle.createUpdate("insert into userTokens (userId, token) value (:userId, :token)").bind("userId", userId).bind("token", token).execute() != 1) {
				throw new PaperbotsException(PaperbotsError.CouldNotVerifyCode);
			}

			String name = handle.createQuery("select name from users where id=:userId").bind("userId", userId).mapTo(String.class).findOnly();
			return new TokenAndName(token, name);
		});
	}

	public void login (String email) {
		if (email == null) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Email must not be null.");
		if (email.trim().length() == 0) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Email must not be empty.");

		final String verifiedEmail = email.trim();

		jdbi.withHandle(handle -> {
			// TODO this should be done in a transaction
			try {
				User user = handle.createQuery("SELECT id, name, email FROM users WHERE email=:email or name=:name").bind("email", verifiedEmail)
					.bind("name", verifiedEmail).mapToBean(User.class).findOnly();
				sendCode(handle, user.getId(), user.getName(), user.getEmail());
				return null;
			} catch (IllegalStateException t) {
				// User doesn't exist
				throw new PaperbotsException(PaperbotsError.UserDoesNotExist);
			}
		});
	}

	public void logout (String token) {
		jdbi.withHandle(handle -> {
			handle.createUpdate("delete from userTokens where token=:token").bind("token", token).execute();
			return null;
		});
	}

	private void sendCode (Handle handle, int userId, String name, String email) {
		// Check if we've send an email in the last 10 minutes, and if so, do nothing.
		try {
			int id = handle.createQuery("select userId from userCodes where userId=:userId and created > DATE_SUB(NOW(), INTERVAL 10 MINUTE)")
				.bind("userId", userId).mapTo(Integer.class).findOnly();
			if (id == userId) return;
		} catch (IllegalStateException e) {
			// Fall through, generate new code and send email.
		}

		String code = generateId(5);
		if (handle.createUpdate("insert into userCodes (userId, code) value (:userId, :code)").bind("userId", userId).bind("code", code).execute() != 1) {
			throw new PaperbotsException(PaperbotsError.CouldNotCreateCode);
		}
		String message = Templates.SIGNUP.render(new TemplateContext().set("name", name).set("code", code));
		emails.send(email, "Paperbots magic code", message);
	}

	public User getUserForToken (String token) {
		if (token == null) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Token must not be null.");
		if (token.trim().length() == 0) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Token must not be empty.");

		final String verifiedToken = token.trim();

		return jdbi.withHandle(handle -> {
			try {
				int userId = handle.createQuery("SELECT userId FROM userTokens WHERE token=:token").bind("token", verifiedToken).mapTo(Integer.class).findOnly();
				User user = handle.createQuery("SELECT * FROM users WHERE id=:id").bind("id", userId).mapToBean(User.class).findOnly();
				return user;
			} catch (IllegalStateException t) {
				throw new PaperbotsException(PaperbotsError.UserDoesNotExist);
			}
		});
	}

	public String saveProject (String token, String code, String title, String description, String content, boolean isPublic, ProjectType type) {
		// Fetch the user based on the token
		User user = getUserForToken(token);

		return jdbi.withHandle(handle -> {
			try {
				if (code == null) {
					String projectCode = generateId(6);
					//@off
					handle.createUpdate("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'").execute();
					handle.createUpdate("insert into projects (userId, userName, code, title, description, content, public, type) value (:userId, :userName, :code, :title, :description, :content, :isPublic, :type)")
						.bind("userId", user.getId())
						.bind("userName", user.getName())
						.bind("code", projectCode)
						.bind("title", title)
						.bind("description", description)
						.bind("content", content)
						.bind("isPublic", isPublic)
						.bind("type", type)
						.execute();
					//@on
					Log.info("Created project " + projectCode + " of user " + user.getName());
					return projectCode;
				} else {
					//@off
					handle.createUpdate("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'").execute();
					handle.createUpdate("update projects set title=:title, description=:description, content=:content, public=:isPublic where code=:code")
						.bind("title", title)
						.bind("description", description)
						.bind("content", content)
						.bind("isPublic", isPublic)
						.bind("code", code)
						.execute();
					//@on
					return code;
				}
			} catch (IllegalStateException t) {
				throw new PaperbotsException(PaperbotsError.ServerError, t);
			}
		});
	}

	public Project getProject (String token, String projectId) {
		User user = token != null && token.length() > 0 ? getUserForToken(token) : null;

		return jdbi.withHandle(handle -> {
			try {
				Project project = handle
					.createQuery("SELECT code, userName, title, description, content, public, type, lastModified, created FROM projects WHERE code=:code")
					.bind("code", projectId).mapToBean(Project.class).findOnly();
				if (!project.isPublic() && (user == null || !project.getUserName().equals(user.getName()))) {
					throw new PaperbotsException(PaperbotsError.ProjectDoesNotExist);
				}
				return project;
			} catch (IllegalStateException t) {
				throw new PaperbotsException(PaperbotsError.ProjectDoesNotExist);
			}
		});
	}

	public Project[] getUserProjects (String token, String userName) {
		User user = token != null && token.length() > 0 ? getUserForToken(token) : null;
		return jdbi.withHandle(handle -> {
			List<Project> projects = handle
				.createQuery("SELECT code, userName, title, public, type, lastModified, created FROM projects WHERE userName=:userName ORDER BY lastModified DESC")
				.bind("userName", userName).mapToBean(Project.class).list();

			if (!userName.equals(user.getName())) {
				return (Project[])projects.stream().filter(p -> p.isPublic()).toArray();
			} else {
				return projects.toArray(new Project[projects.size()]);
			}
		});
	}

	public Project[] getFeaturedProjects () {
		return jdbi.withHandle(handle -> {
			List<Project> projects = handle
				.createQuery(
					"SELECT code, userName, title, type, lastModified, created, content FROM projects WHERE featured=1 AND public=1 ORDER BY lastModified DESC")
				.mapToBean(Project.class).list();
			return projects.toArray(new Project[projects.size()]);
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

	public static class TokenAndName {
		public String token;
		public String name;

		public TokenAndName (String token, String name) {
			super();
			this.token = token;
			this.name = name;
		}
	}
}
