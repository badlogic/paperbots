
package io.paperbots.data;

public class User {
	private int id;
	private String name;
	private String email;
	private String created;
	private UserType type;

	public User () {
	}

	public User (int id, String name, String email, String created, UserType type) {
		super();
		this.id = id;
		this.name = name;
		this.email = email;
		this.created = created;
		this.type = type;
	}

	public int getId () {
		return id;
	}

	public void setId (int id) {
		this.id = id;
	}

	public String getName () {
		return name;
	}

	public void setName (String name) {
		this.name = name;
	}

	public String getEmail () {
		return email;
	}

	public void setEmail (String email) {
		this.email = email;
	}

	public String getCreated () {
		return created;
	}

	public void setCreated (String created) {
		this.created = created;
	}

	public UserType getType () {
		return type;
	}

	public void setType (UserType type) {
		this.type = type;
	}

	@Override
	public String toString () {
		return "User [id=" + id + ", name=" + name + ", email=" + email + ", created=" + created + ", type=" + type + "]";
	}
}
