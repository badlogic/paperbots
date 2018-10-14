
package io.paperbots;

import org.junit.BeforeClass;
import org.junit.Test;

import io.paperbots.data.UserType;

public class PaperbotsTest {
	private static Paperbots paperbots;

	@BeforeClass
	public static void setup () {
		paperbots = new Paperbots(Paperbots.setupDatabase(), new Emails(Paperbots.PAPERBOTS_EMAIL_PWD));
	}

	@Test
	public void testSignup () {
		paperbots.signup("badlogic", "badlogicgames@gmail.com", UserType.admin);
		paperbots.signup("badlogic", "badlogicgames@gmail.com", UserType.admin);
		paperbots.verifyCode("esiqv");
	}
}
