
package io.paperbots;

import java.io.File;
import java.security.MessageDigest;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.esotericsoftware.minlog.Log;

import io.javalin.Javalin;
import io.javalin.staticfiles.Location;
import io.javalin.websocket.WsHandler;
import io.javalin.websocket.WsSession;
import io.marioslab.basis.site.FileWatcher;
import io.paperbots.Paperbots.Sorting;
import io.paperbots.Paperbots.TokenAndName;
import io.paperbots.PaperbotsException.PaperbotsError;
import io.paperbots.data.Project;
import io.paperbots.data.ProjectType;
import io.paperbots.data.UserType;

import javax.servlet.http.Cookie;

public class Server {
	private boolean isRunning = false;
	private final Javalin app;

	public Server (Paperbots paperbots, boolean reload, File staticFiles) {
		if (!staticFiles.exists()) throw new RuntimeException("Static file directory '" + staticFiles.getPath() + "' does not exist.");

		app = Javalin.create().enableStaticFiles(staticFiles.getAbsolutePath(), Location.EXTERNAL);

		// Websockets for local development
		if (reload) {
			final Map<WsHandler, WsSession> wsClients = new ConcurrentHashMap<>();
			Thread generatorThread = new Thread((Runnable) () -> {
				try {
					FileWatcher.watch(staticFiles, () -> {
						for (WsSession session : wsClients.values()) {
							Log.info("Static content changed, telling websocket clients.");
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

			// Websockets for local development
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

		// Reload API
		app.post("/api/reloadstatic", ctx -> {
			String pwd = ctx.formParam("password");
			if (MessageDigest.isEqual(pwd.getBytes(), Paperbots.getConfig().getReloadPassword().getBytes())) {
				new ProcessBuilder().command("git", "pull").start();
				Log.info("Got new static content.");
				ctx.result("OK");
			}
		});

		app.post("/api/reload", ctx -> {
			String pwd = ctx.formParam("password");
			if (MessageDigest.isEqual(pwd.getBytes(), Paperbots.getConfig().getReloadPassword().getBytes())) {
				ctx.result("OK.");
				ctx.res.flushBuffer();
				Log.info("Got an update. Shutting down.");
				System.exit(-1);
			}
		});

		// User management
		app.post("/api/signup", ctx -> {
			SignupRequest request = ctx.bodyAsClass(SignupRequest.class);
			paperbots.signup(request.name, request.email, UserType.user);
		});

		app.post("/api/login", ctx -> {
			LoginRequest request = ctx.bodyAsClass(LoginRequest.class);
			paperbots.login(request.email);
		});

		app.post("/api/verify", ctx -> {
			VerifyRequest request = ctx.bodyAsClass(VerifyRequest.class);
			TokenAndName tokenAndName = paperbots.verifyCode(request.code);
			ctx.cookie("name", tokenAndName.name, Integer.MAX_VALUE);
			final Cookie token = new Cookie("token", tokenAndName.token);
			token.setMaxAge(Integer.MAX_VALUE);
			if (!reload) {
				token.setSecure(true);
				token.setHttpOnly(true);
				// TODO: no way to set same site restriction for CSRF DiD?
			}
			ctx.cookie(token);
		});

		app.post("/api/logout", ctx -> {
			String token = ctx.cookie("token");
			ctx.cookie("name", "", -1);
			ctx.cookie("token", "", -1);
			paperbots.logout(token);
		});

		// Project management
		app.post("/api/getproject", ctx -> {
			ProjectRequest request = ctx.bodyAsClass(ProjectRequest.class);
			Project project = paperbots.getProject(ctx.cookie("token"), request.projectId);
			ctx.json(project);
		});

		app.post("/api/getprojects", ctx -> {
			ProjectsRequest request = ctx.bodyAsClass(ProjectsRequest.class);
			ctx.json(paperbots.getUserProjects(ctx.cookie("token"), request.userName, request.worldData));
		});

		app.post("/api/saveproject", ctx -> {
			Project request = ctx.bodyAsClass(Project.class);
			String projectId = paperbots.saveProject(ctx.cookie("token"), request.getCode(), request.getTitle(), request.getDescription(), request.getContent(),
				request.isPublic(), request.getType());
			ctx.json(new ProjectRequest(projectId));
		});

		app.post("/api/deleteproject", ctx -> {
			ProjectRequest request = ctx.bodyAsClass(ProjectRequest.class);
			paperbots.deleteProject(ctx.cookie("token"), request.projectId);
		});

		app.post("/api/getfeaturedprojects", ctx -> {
			ctx.json(paperbots.getFeaturedProjects());
		});

		// Error handling
		app.error(404, ctx -> {
			ctx.redirect("/404.html");
		});

		app.post("/api/exception", ctx -> {
			throw new RuntimeException("This is a test");
		});

		app.exception(PaperbotsException.class, (e, ctx) -> {
			Log.info(e.getMessage(), e);
			ctx.json(new ErrorResponse(e.getError()));
			ctx.status(400);
		});

		app.exception(Exception.class, (e, ctx) -> {
			Log.info(e.getMessage(), e);
			ctx.json(new ErrorResponse(PaperbotsError.ServerError));
			ctx.status(500);
		});

		// Admin endpoints
		app.post("/api/getprojectsadmin", ctx -> {
			ProjectsRequest request = ctx.bodyAsClass(ProjectsRequest.class);
			ctx.json(paperbots.getProjectsAdmin(ctx.cookie("token"), request.sorting, request.dateOffset));
		});

		// CSFR headers
		app.before(ctx -> {
			ctx.header("Content-Security-Policy", "script-src 'self' 'unsafe-inline';");
			ctx.header("X-Frame-Options", "SAMEORIGIN");
			ctx.header("X-Xss-Protection", "1; mode=block");
			ctx.header("X-Content-Type-Options", "nosniff");
			ctx.header("Referrer-Policy", "no-referrer-when-downgrade");
			ctx.header("Feature-Policy",
				"geolocation 'self'; midi 'self'; sync-xhr 'self'; microphone 'self'; camera 'self'; magnetometer 'self'; gyroscope 'self'; speaker 'self'; fullscreen *; payment 'self';");
		});

		app.port(8001).start();
		this.isRunning = true;
	}

	public boolean isRunning () {
		return isRunning;
	}

	public void stop () {
		if (isRunning) {
			app.stop();
			isRunning = false;
		}
	}

	public static class SignupRequest {
		public String name;
		public String email;

		public SignupRequest () {
		}

		public SignupRequest (String name, String email) {
			super();
			this.name = name;
			this.email = email;
		}
	}

	public static class LoginRequest {
		public String email;

		public LoginRequest () {
		}

		public LoginRequest (String email) {
			super();
			this.email = email;
		}
	}

	public static class VerifyRequest {
		public String code;

		public VerifyRequest () {
		}

		public VerifyRequest (String code) {
			super();
			this.code = code;
		}
	}

	public static class ProjectRequest {
		public String projectId;

		public ProjectRequest () {
		}

		public ProjectRequest (String projectId) {
			super();
			this.projectId = projectId;
		}
	}

	public static class ProjectsRequest {
		public String userName;
		public Sorting sorting;
		public String dateOffset;
		public boolean worldData;

		public ProjectsRequest () {
		}

		public ProjectsRequest (String userName, boolean worldData) {
			this.userName = userName;
			this.worldData = worldData;
		}
	}

	public static class ErrorResponse {
		public PaperbotsError error;

		public ErrorResponse () {
		}

		public ErrorResponse (PaperbotsError error) {
			this.error = error;
		}
	}
}
