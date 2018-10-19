
package io.paperbots.data;

public class Project {
	public static enum Type {
		robot, canvas
	}

	private String userName;
	private String code;
	private String title;
	private String description;
	private String content;
	private String created;
	private String lastModified;
	private boolean isPublic;
	private Type type;

	public Project () {
	}

	public String getUserName () {
		return userName;
	}

	public void setUserName (String userName) {
		this.userName = userName;
	}

	public String getCode () {
		return code;
	}

	public void setCode (String code) {
		this.code = code;
	}

	public String getTitle () {
		return title;
	}

	public void setTitle (String title) {
		this.title = title;
	}

	public String getDescription () {
		return description;
	}

	public void setDescription (String description) {
		this.description = description;
	}

	public String getContent () {
		return content;
	}

	public void setContent (String content) {
		this.content = content;
	}

	public String getCreated () {
		return created;
	}

	public void setCreated (String created) {
		this.created = created;
	}

	public String getLastModified () {
		return lastModified;
	}

	public void setLastModified (String lastModified) {
		this.lastModified = lastModified;
	}

	public boolean isPublic () {
		return isPublic;
	}

	public void setPublic (boolean isPublic) {
		this.isPublic = isPublic;
	}
}
