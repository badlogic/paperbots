
package io.paperbots;

import java.util.Date;
import java.util.Properties;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import io.paperbots.PaperbotsException.PaperbotsError;

public class Emails {
	private final Session session;

	public Emails (String emailPassword) {
		Properties props = new Properties();
		props.put("mail.smtp.host", "true");
		props.put("mail.smtp.starttls.enable", "true");
		props.put("mail.smtp.host", "smtp.gmail.com");
		props.put("mail.smtp.port", "587");
		props.put("mail.smtp.auth", "true");
		this.session = Session.getInstance(props, new javax.mail.Authenticator() {
			@Override
			protected PasswordAuthentication getPasswordAuthentication () {
				return new PasswordAuthentication("contact@paperbots.io", emailPassword);
			}
		});
	}

	public void send (String to, String subject, String message) {
		try {
			MimeMessage msg = new MimeMessage(session);
			InternetAddress[] address = InternetAddress.parse(to, true);
			msg.setFrom(InternetAddress.parse("contact@paperbots.io")[0]);
			msg.setRecipients(Message.RecipientType.TO, address);
			msg.setSubject(subject);
			msg.setSentDate(new Date());
			msg.setText(message);
			msg.setHeader("XPriority", "1");
			Transport.send(msg);
		} catch (MessagingException e) {
			throw new PaperbotsException(PaperbotsError.CouldNotSendEmail, e);
		}
	}
}
