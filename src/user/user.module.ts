import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserCourseService } from './user-course/user-course.service'
import { ApplicationService } from 'src/application/application.service'
import { UserApplicationService } from './user-application/user-appllication.service'
import { UserApplicationController } from './user-application/user-application.controller'
import { UserCourseController } from './user-course/user-course.controller'

@Module({
	controllers: [
		UserController,
		UserApplicationController,
		UserCourseController,
	],
	providers: [
		UserService,
		UserCourseService,
		UserApplicationService,
		PrismaService,
		ApplicationService,
	],
	exports: [
		UserService,
		UserCourseService,
		UserApplicationService,
		UserCourseService,
	],
})
export class UserModule {}
