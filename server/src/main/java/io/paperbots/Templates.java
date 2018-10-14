
package io.paperbots;

import io.marioslab.basis.template.Template;
import io.marioslab.basis.template.TemplateLoader;

public class Templates {
	public static final Template SIGNUP;

	static {
		TemplateLoader loader = new TemplateLoader.ClasspathTemplateLoader();
		SIGNUP = loader.load("/templates/signup.bt");
	}
}
