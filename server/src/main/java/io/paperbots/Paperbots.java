
package io.paperbots;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;
import java.util.List;

import org.apache.commons.validator.routines.EmailValidator;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.owasp.encoder.Encode;

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

/** To run this locally:
 *
 * <ul>
 * <li>Enter a valid email configuration in the dev-config.json file.</li>
 * <li>Run the <code>mysql-dev.sh</code> script to start a Docker MySQL instance locally.</li>
 * <li>Start this class with the arguments <code>-c dev-config.json -r -s ../client/site</code></li>
 * </ul>
 */
public class Paperbots {
	private static Config config;

	public static Config getConfig () {
		return config;
	}

	public static void main (String[] cliArgs) {
		Arguments args = new Arguments();
		StringArgument configFileArg = args.addArgument(new StringArgument("-c", "Config file.", "<file>", true));
		StringArgument staticFilesArg = args.addArgument(new StringArgument("-s", "Static files directory.", "<dir>", false));
		Argument reloadArg = args
			.addArgument(new Argument("-r", "Whether to tell any browser websocket clients to\nreload the site when the output was\nre-generated", true));

		try {
			ParsedArguments parsed = args.parse(cliArgs);
			File staticFiles = new File(parsed.getValue(staticFilesArg));

			if (parsed.has(configFileArg)) {
				File configFile = new File(parsed.getValue(configFileArg));
				Paperbots.config = Config.fromFile(configFile);
			} else {
				Paperbots.config = Config.fromEnv();
			}

			Jdbi jdbi = Database.setupDatabase(config.getDatabaseConfig(), false);
			Emails emails = new Emails.JavaxEmails(config.getEmailConfig());
			Files files = new Files(config.getFilesConfig());
			Paperbots paperbots = new Paperbots(jdbi, emails, files);
			new Server(paperbots, parsed.has(reloadArg), staticFiles);
		} catch (Throwable e) {
			Log.error(e.getMessage(), e);
			args.printHelp(System.out);
			System.exit(-1);
			return; // never reached
		}
	}

	private final Emails emails;
	private final Jdbi jdbi;
	private final Files files;

	public Paperbots (Jdbi jdbi, Emails emails, Files files) {
		this.jdbi = jdbi;
		this.emails = emails;
		this.files = files;
	}

	public Files getFiles () {
		return files;
	}

	public void signup (String name, String email, UserType type) {
		if (name == null) throw new PaperbotsException(PaperbotsError.InvalidArgument, "User name must not be null.");
		if (name.trim().length() == 0) throw new PaperbotsException(PaperbotsError.InvalidArgument, "User name must not be empty.");
		if (email == null) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Email must not be null.");
		if (email.trim().length() == 0) throw new PaperbotsException(PaperbotsError.InvalidArgument, "Email must not be empty.");

		final String verifiedEmail = Encode.forHtml(email.trim());
		final String verifiedName = Encode.forHtml(name.trim());

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

		try {
			emails.send(email, "Paperbots magic code", message);
		} catch (Throwable t) {
			handle.createUpdate("delete from userCodes where userId=:userId").bind("code", code).bind("userId", userId).execute();
			throw t;
		}
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
						.bind("title", Encode.forHtml(title))
						.bind("description", Encode.forHtml(description))
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
					int rows = handle.createUpdate("update projects set title=:title, description=:description, content=:content, public=:isPublic where code=:code and userId=:userId")
						.bind("title", Encode.forHtml(title))
						.bind("description", Encode.forHtml(description))
						.bind("content", content)
						.bind("isPublic", isPublic)
						.bind("code", code)
						.bind("userId", user.getId())
						.execute();
					//@on
					if (rows == 0) throw new PaperbotsException(PaperbotsError.ProjectDoesNotExist);
					return code;
				}
			} catch (IllegalStateException t) {
				throw new PaperbotsException(PaperbotsError.ServerError, t);
			}
		});
	}

	public void saveThumbnail (String token, String code, String thumbnail) {
		if (!thumbnail.startsWith("data:image/png;base64,")) throw new PaperbotsException(PaperbotsError.ProjectDoesNotExist);
		thumbnail = thumbnail.substring("data:image/png;base64,".length());
		byte[] decodedThumbnail;
		try {
			decodedThumbnail = Base64.getDecoder().decode(thumbnail.getBytes("UTF-8"));
		} catch (UnsupportedEncodingException e) {
			throw new PaperbotsException(PaperbotsError.ServerError, "Couldn't decode thumbnail", e);
		}
		User user = getUserForToken(token);
		jdbi.withHandle(handle -> {
			try {
				Project project = handle.createQuery("SELECT userName FROM projects WHERE code=:code").bind("code", code).mapToBean(Project.class).findOnly();
				if (!project.getUserName().equals(user.getName())) {
					throw new PaperbotsException(PaperbotsError.ProjectDoesNotExist);
				}
				files.saveThumbnail(code, decodedThumbnail);
				return null;
			} catch (Throwable t) {
				throw new PaperbotsException(PaperbotsError.ProjectDoesNotExist);
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

	public void deleteProject (String token, String projectId) {
		User user = getUserForToken(token);

		jdbi.withHandle(handle -> {
			try {
				Project project = handle.createQuery("SELECT userName FROM projects WHERE code=:code").bind("code", projectId).mapToBean(Project.class).findOnly();
				if (!project.getUserName().equals(user.getName())) {
					throw new PaperbotsException(PaperbotsError.ProjectDoesNotExist);
				}
				handle.createUpdate("delete from projects where code=:code").bind("code", projectId).execute();
				return null;
			} catch (IllegalStateException t) {
				throw new PaperbotsException(PaperbotsError.ProjectDoesNotExist);
			}
		});
	}

	public Project[] getUserProjects (String token, String userName, boolean worldData) {
		User user = token != null && token.length() > 0 ? getUserForToken(token) : null;
		return jdbi.withHandle(handle -> {
			List<Project> projects = worldData
				? handle.createQuery(
					"SELECT code, userName, title, public, type, lastModified, created, content FROM projects WHERE userName=:userName ORDER BY lastModified DESC")
					.bind("userName", userName).mapToBean(Project.class).list()
				: handle
					.createQuery(
						"SELECT code, userName, title, public, type, lastModified, created FROM projects WHERE userName=:userName ORDER BY lastModified DESC")
					.bind("userName", userName).mapToBean(Project.class).list();

			if (user == null || !userName.equals(user.getName())) {
				return projects.stream().filter(p -> p.isPublic()).toArray(size -> new Project[size]);
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

	//
	// Admin functionality, requires a token from a user that is an admin.
	//
	public static enum Sorting {
		Newest, Oldest, LastModified
	}

	public Project[] getProjectsAdmin (String token, Sorting sorting, String dateOffset) {
		User user = getUserForToken(token);
		if (user.getType() != UserType.admin) throw new PaperbotsException(PaperbotsError.InvalidUserName);
		return jdbi.withHandle(handle -> {
			String sqlSorting = "created DESC";
			if (sorting == Sorting.Newest) {
				sqlSorting = "created DESC";
			} else if (sorting == Sorting.Oldest) {
				sqlSorting = "created ASC";
			} else if (sorting == Sorting.LastModified) {
				sqlSorting = "lastModified DESC";
			}
			String offset = dateOffset;
			if (offset == null) {
				offset = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss").format(new Date());
			}
			List<Project> projects = handle
				.createQuery("SELECT code, userName, title, public, type, lastModified, created, content FROM projects WHERE created < :dateOffset ORDER BY "
					+ sqlSorting + " LIMIT 10")
				.bind("dateOffset", offset).mapToBean(Project.class).list();
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
