
package io.paperbots;

import java.io.File;
import java.io.IOException;

import io.paperbots.Config.FilesConfig;
import io.paperbots.PaperbotsException.PaperbotsError;

/** Handles user uploads of screenshots/thumbnails and any other types of files. */
public class Files {
	private final FilesConfig config;
	private final File filesDir;

	public Files (FilesConfig config) {
		this.config = config;
		this.filesDir = new File(config.getFilesDir());
		if (this.filesDir.exists() && this.filesDir.isFile())
			throw new IllegalArgumentException("Files directory " + config.getFilesDir() + " must be a directory, not a file.");
		if (!this.filesDir.exists() && !this.filesDir.mkdirs()) throw new IllegalArgumentException("Couldn't delete files directory " + config.getFilesDir());
	}

	public void saveFile (String fileName, byte[] content) {
		try {
			java.nio.file.Files.write(new File(filesDir, fileName).toPath(), content);
		} catch (IOException e) {
			throw new PaperbotsException(PaperbotsError.ServerError, "Couldn't write file " + fileName, e);
		}
	}
}
