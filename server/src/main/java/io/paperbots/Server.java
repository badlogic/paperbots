
package io.paperbots;

import java.io.File;
import java.security.MessageDigest;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.esotericsoftware.minlog.Log;

import io.javalin.Javalin;
import io.javalin.embeddedserver.Location;
import io.javalin.embeddedserver.jetty.websocket.WebSocketHandler;
import io.javalin.embeddedserver.jetty.websocket.WsSession;
import io.marioslab.basis.site.FileWatcher;
import io.paperbots.PaperbotsException.PaperbotsError;
import io.paperbots.data.UserType;

public class Server {
	private boolean isRunning = false;
	private final Javalin app;

	public Server (Paperbots paperbots, boolean reload, File staticFiles) {
		if (!staticFiles.exists()) throw new RuntimeException("Static file directory '" + staticFiles.getPath() + "' does not exist.");

		app = Javalin.create().enableDynamicGzip().enableStaticFiles(staticFiles.getAbsolutePath(), Location.EXTERNAL);

		if (reload) {
			final Map<WebSocketHandler, WsSession> wsClients = new ConcurrentHashMap<>();
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
			if (MessageDigest.isEqual(pwd.getBytes(), Paperbots.PAPERBOTS_RELOAD_PWD.getBytes())) {
				new ProcessBuilder().command("git", "pull").start();
				Log.info("Got new static content.");
				ctx.response().getWriter().println("OK.");
			}
		});

		app.post("/api/reload", ctx -> {
			String pwd = ctx.formParam("password");
			if (MessageDigest.isEqual(pwd.getBytes(), Paperbots.PAPERBOTS_RELOAD_PWD.getBytes())) {
				ctx.response().getWriter().println("OK.");
				ctx.response().getWriter().flush();
				Log.info("Got an update. Shutting down.");
				System.exit(-1);
			}
		});

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
			ctx.json(paperbots.verifyCode(request.code));
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

		// TODO setup handler for non PaperbotsException

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

	public static class VerifyResponse {
		public String token;
		public String name;

		public VerifyResponse () {
		}

		public VerifyResponse (String token, String name) {
			super();
			this.token = token;
			this.name = name;
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
