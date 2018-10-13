
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
import io.marioslab.basis.arguments.Argument;
import io.marioslab.basis.arguments.ArgumentWithValue.StringArgument;
import io.marioslab.basis.arguments.Arguments;
import io.marioslab.basis.arguments.Arguments.ParsedArguments;
import io.marioslab.basis.site.FileWatcher;

public class Paperbots {
	private static Map<WebSocketHandler, WsSession> wsClients = new ConcurrentHashMap<>();

	public static void main (String[] cliArgs) {
		Arguments args = new Arguments();
		StringArgument passwordArg = args
			.addArgument(new StringArgument("-p", "Password that must be provided for reload endpoints.", "<password>", false));
		StringArgument staticFilesArg = args.addArgument(new StringArgument("-s", "Static files directory.", "<dir>", false));
		Argument reloadArg = args.addArgument(new Argument("-r",
			"Whether to tell any browser websocket clients to\nreload the site when the output was\nre-generated", true));

		ParsedArguments parsed;
		byte[] password;
		File staticFiles;

		try {
			parsed = args.parse(cliArgs);
			password = parsed.getValue(passwordArg).getBytes("UTF-8");
			staticFiles = new File(parsed.getValue(staticFilesArg));
			if (!staticFiles.exists())
				throw new RuntimeException("Static file directory '" + staticFiles.getPath() + "' does not exist.");
		} catch (Throwable e) {
			Log.error(e.getMessage());
			Log.debug("Exception", e);
			args.printHelp(System.out);
			System.exit(-1);
			return; // never reached
		}

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

		Javalin app = Javalin.create().enableDynamicGzip().enableStaticFiles(staticFiles.getAbsolutePath(), Location.EXTERNAL)
			.port(8001).start();

		if (parsed.has(reloadArg)) {
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
			if (MessageDigest.isEqual(pwd.getBytes(), password)) {
				new ProcessBuilder().command("git", "pull").start();
				Log.info("Got new static content.");
				ctx.response().getWriter().println("OK.");
			}
		});

		app.post("/api/reload", ctx -> {
			String pwd = ctx.formParam("password");
			if (MessageDigest.isEqual(pwd.getBytes(), password)) {
				ctx.response().getWriter().println("OK.");
				ctx.response().getWriter().flush();
				Log.info("Got an update. Shutting down.");
				System.exit(-1);
			}
		});
	}
}
