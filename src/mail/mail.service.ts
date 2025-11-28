import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createTransport, type Transporter } from 'nodemailer'

@Injectable()
export class MailService {
	private transporter: Transporter

	constructor(private configService: ConfigService) {
		this.transporter = createTransport({
			service: 'gmail',
			auth: {
				user: this.configService.get<string>('MAIL_USERNAME'),
				pass: this.configService.get<string>('MAIL_PASSWORD'),
			},
		})
	}

	async send(email: string, code: string, subject: string, message?: string) {
		const htmlContent = message
			? `<p>${message}</p><p>Code: <b>${code}</b></p>`
			: `<p>Your code is: <b>${code}</b></p>`

		await this.transporter.sendMail({
			from: `SmartBala Family`,
			to: email,
			subject,
			html: htmlContent,
		})
	}

	async sendInvite(email: string, code: string) {
		const subject = 'Join your family on SmartBala!'

		await this.send(email, code, subject)
	}
}
