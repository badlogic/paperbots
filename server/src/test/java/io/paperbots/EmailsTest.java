
package io.paperbots;

import org.junit.Test;

import io.marioslab.basis.template.TemplateContext;

public class EmailsTest {
	@Test
	public void testTemplate () {
		String email = Templates.SIGNUP.render(new TemplateContext().set("name", "badlogic").set("code", "34bxD"));
		new Emails(System.getenv("PAPERBOTS_EMAIL_PWD")).send("badlogicgames@gmail.com", "Paperbots magic code", email);
		;
	}
}
