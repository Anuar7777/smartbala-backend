import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import basicAuth from 'express-basic-auth'
import { AppModule } from './app.module'
import { Response } from 'express'

const logger = new Logger('Bootstrap')

async function bootstrap() {
	try {
		const app = await NestFactory.create(AppModule)

		const configService = app.get(ConfigService)

		app.setGlobalPrefix('api')
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
			}),
		)
		app.use(cookieParser())

		app.use(
			['/api/docs', '/api/docs-json'],
			basicAuth({
				challenge: true,
				users: {
					admin: 'smartbala2025',
				},
			}),
		)

		app
			.getHttpAdapter()
			.get(
				'/loaderio-6f61de618b9fdb82d1fb66878edf338a.txt',
				(_, res: Response) => {
					res.send('loaderio-6f61de618b9fdb82d1fb66878edf338a')
				},
			)

		const swaggerConfig = new DocumentBuilder()
			.setTitle('SmartBala API')
			.setDescription('API documentation for SmartBala')
			.setVersion('1.0')
			.addBearerAuth()
			.build()

		const document = SwaggerModule.createDocument(app, swaggerConfig)
		SwaggerModule.setup('api/docs', app, document)

		await app.listen(configService.get('PORT', 5000))
	} catch (error) {
		logger.error('Error when starting the server: ', error)
		process.exit(1)
	}
}

void bootstrap()
