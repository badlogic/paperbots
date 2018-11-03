
package io.paperbots;

public class TestEmails implements Emails {
	private String to;
	private String subject;
	private String message;

	@Override
	public void send (String to, String subject, String message) {
		this.to = to;
		this.subject = subject;
		this.message = message;
	}

	public String getTo () {
		return to;
	}

	public String getSubject () {
		return subject;
	}

	public String getMessage () {
		return message;
	}
}
