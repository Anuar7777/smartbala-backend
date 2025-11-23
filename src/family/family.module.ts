import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UserService } from '../user/user.service'
import { CodeService } from '../code/code.service'
import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma.service'
import { SettingsService } from '../settings/settings.service'
import { FamilyCourseController } from './family-course/family-course.controller'
import { FamilySettingsController } from './family-settings.controller'
import { FamilyController } from './family.controller'
import { FamilyService } from './family.service'
import { FamilyCourseService } from './family-course/family-course.service'
import { UserApplicationService } from '../user/user-application/user-appllication.service'
import { ApplicationService } from '../application/application.service'
import { FamilyApplicationController } from './family-application/family-application.controller'
import { FamilyApplicationService } from './family-application/family-application.service'
import { FamilyAchievementController } from './famiily-achievement/family-achievement.controller'
import { FamilyAchievementService } from './famiily-achievement/family-achievement.service'
import { AchievementModule } from '../achievement/achievement.module'
import { StatisticsService } from '../statistics/statistics.service'
import { FamilyStatisticsController } from './family-statistics/family-statistics.controller'
import { FamilyStatisticsService } from './family-statistics/family-statistics.service'
import { UserCourseService } from 'src/user/user-course/user-course.service'

@Module({
	imports: [ConfigModule, AchievementModule],
	controllers: [
		FamilyController,
		FamilyCourseController,
		FamilySettingsController,
		FamilyApplicationController,
		FamilyAchievementController,
		FamilyStatisticsController,
	],
	providers: [
		FamilyService,
		FamilyCourseService,
		PrismaService,
		CodeService,
		MailService,
		SettingsService,
		UserService,
		UserApplicationService,
		ApplicationService,
		FamilyApplicationService,
		FamilyAchievementService,
		StatisticsService,
		FamilyStatisticsService,
		UserCourseService,
	],
	exports: [FamilyService],
})
export class FamilyModule {}
