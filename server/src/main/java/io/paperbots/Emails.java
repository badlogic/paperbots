
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

import com.esotericsoftware.minlog.Log;
import io.paperbots.Config.EmailConfig;
import io.paperbots.PaperbotsException.PaperbotsError;

public interface Emails {
	void send (String to, String subject, String message);

	public static class JavaxEmails implements Emails {
		private final Session session;
		private final EmailConfig config;

		public JavaxEmails (EmailConfig config) {
			this.config = config;
			Properties props = new Properties();
			props.put("mail.smtp.host", "true");
			props.put("mail.smtp.starttls.enable", "true");
			props.put("mail.smtp.auth", "true");
			props.put("mail.smtp.host", config.getHost()); // "smtp.gmail.com");
			props.put("mail.smtp.port", config.getPort()); // "587");
			props.put("mail.smtp.ssl.enable", config.getSslEnabled()); // off by default
			props.put("mail.smtp.timeout", 10000);
			this.session = Session.getInstance(props, new javax.mail.Authenticator() {
				@Override
				protected PasswordAuthentication getPasswordAuthentication () {
					return new PasswordAuthentication(config.getEmail(), config.getPassword());
				}
			});
		}

		@Override
		public void send (String to, String subject, String message) {
			try {
				MimeMessage msg = new MimeMessage(session);
				InternetAddress[] address = InternetAddress.parse(to, true);
				msg.setFrom(InternetAddress.parse(config.getEmail())[0]);
				msg.setRecipients(Message.RecipientType.TO, address);
				msg.setSubject(subject);
				msg.setSentDate(new Date());
				msg.setText(message);
				msg.setHeader("XPriority", "1");
				Transport.send(msg);
			} catch (MessagingException e) {
				Log.error("Could not send email", e);
				throw new PaperbotsException(PaperbotsError.CouldNotSendEmail, e);
			}
		}
	}
}
