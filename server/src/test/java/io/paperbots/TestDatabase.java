
package io.paperbots;

import org.jdbi.v3.core.Jdbi;

public class TestDatabase {
	public static Jdbi setupDatabase () {
		return Jdbi.create("jdbc:h2:mem:test");
	}
}
