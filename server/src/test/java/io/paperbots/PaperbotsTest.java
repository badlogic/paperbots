
package io.paperbots;

import org.junit.BeforeClass;
import org.junit.Test;

import io.paperbots.data.UserType;

public class PaperbotsTest {
	private static Paperbots paperbots;
	private static Emails emails = new Emails.TestEmails();

	@BeforeClass
	public static void setup () {
		paperbots = new Paperbots(TestDatabase.setupDatabase(), emails);
	}

	@Test
	public void testSignup () {
		paperbots.signup("badlogic", "badlogicgames@gmail.com", UserType.admin);
		paperbots.signup("badlogic", "badlogicgames@gmail.com", UserType.admin);
		paperbots.verifyCode("esiqv");
	}
}
