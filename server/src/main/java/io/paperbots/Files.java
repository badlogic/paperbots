
package io.paperbots;

import java.io.File;
import java.io.IOException;

import io.paperbots.Config.FilesConfig;
import io.paperbots.PaperbotsException.PaperbotsError;

/** Handles user uploads of screenshots/thumbnails and any other types of files. */
public class Files {
	private final FilesConfig config;
	private final File filesDir;
	private final File thumbnailsDir;

	public Files (FilesConfig config) {
		this.config = config;
		this.filesDir = new File(config.getFilesDir());
		if (this.filesDir.exists() && this.filesDir.isFile())
			throw new IllegalArgumentException("Files directory " + config.getFilesDir() + " must be a directory, not a file.");
		if (!this.filesDir.exists() && !this.filesDir.mkdirs()) throw new IllegalArgumentException("Couldn't create directory " + config.getFilesDir());
		thumbnailsDir = new File(this.filesDir, "thumbnails");
		if (!this.thumbnailsDir.exists() && !this.thumbnailsDir.mkdirs())
			throw new IllegalArgumentException("Couldn't create directory " + this.thumbnailsDir.getParent());
	}

	public FilesConfig getConfig () {
		return config;
	}

	public File getFilesDir () {
		return filesDir;
	}

	public void saveThumbnail (String projectId, byte[] content) {
		if (projectId.contains("..")) throw new PaperbotsException(PaperbotsError.ServerError, "Couldn't write file");
		saveFile(new File(this.thumbnailsDir, projectId + ".png"), content);
	}

	private void saveFile (File file, byte[] content) {
		try {
			java.nio.file.Files.write(file.toPath(), content);
		} catch (IOException e) {
			throw new PaperbotsException(PaperbotsError.ServerError, "Couldn't write file", e);
		}
	}
}
