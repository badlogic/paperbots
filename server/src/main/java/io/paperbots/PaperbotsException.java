
package io.paperbots;

public class PaperbotsException extends RuntimeException {
	public static enum PaperbotsError {
		InvalidArgument, InvalidEmailAddress, InvalidUserName, ServerError, UserDoesNotExist, UserExists, EmailExists, ProjectDoesNotExist, CouldNotCreateUser, CouldNotSendEmail, CouldNotCreateCode, CouldNotVerifyCode
	}

	private static final long serialVersionUID = -8984556916130982262L;
	private final PaperbotsError error;

	public PaperbotsException (PaperbotsError error) {
		super();
		this.error = error;
	}

	public PaperbotsException (PaperbotsError error, String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
		super(message, cause, enableSuppression, writableStackTrace);
		this.error = error;
	}

	public PaperbotsException (PaperbotsError error, String message, Throwable cause) {
		super(message, cause);
		this.error = error;
	}

	public PaperbotsException (PaperbotsError error, String message) {
		super(message);
		this.error = error;
	}

	public PaperbotsException (PaperbotsError error, Throwable cause) {
		super(cause);
		this.error = error;
	}

	public PaperbotsError getError () {
		return error;
	}

	@Override
	public String getMessage () {
		return error + (super.getMessage() == null ? "" : ": " + super.getMessage());
	}
}
