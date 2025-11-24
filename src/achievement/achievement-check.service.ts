import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { AchievementService } from './achievement.service'
import { Achievement } from './achievement.data'
import { TestStatus } from '@prisma/client'
import { TestService } from '../test/test.service'

@Injectable()
export class AchievementCheckService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly achievementService: AchievementService,
		@Inject(forwardRef(() => TestService))
		private readonly testService: TestService,
	) {}

	/**
	 * Проверка и выдача достижений после завершения теста
	 */
	async checkTestAchievements(userId: string, testId: string) {
		const test = await this.testService.get(testId)

		if (!test) return

		// Достижение "Высший балл" — 100%
		if (test.score === 100) {
			await this.achievementService.grantAchievement(
				userId,
				Achievement.PERFECT_SCORE,
			)
		}
	}

	/**
	 * Проверка и выдача достижений после завершения курса
	 */
	async checkCourseAchievements(userId: string, courseId: string) {
		const userCourse = await this.prisma.userCourse.findUnique({
			where: { userId_courseId: { userId, courseId } },
		})

		if (!userCourse) return

		// Достижение "Первый шаг" — первый тест курса пройден
		const firstTest = await this.prisma.test.findFirst({
			where: { userId, courseId, status: TestStatus.PASSED },
			orderBy: { updatedAt: 'asc' },
		})
		if (firstTest) {
			await this.achievementService.grantAchievement(
				userId,
				Achievement.FIRST_STEP,
			)
		}

		// Количество завершенных курсов пользователя
		const completedCourses = await this.prisma.userCourse.count({
			where: { userId, completedSections: { gte: 3 } },
		})

		// Достижение "Готов к следующему уровню" — пройти 3 курса
		if (completedCourses >= 3) {
			await this.achievementService.grantAchievement(
				userId,
				Achievement.READY_FOR_NEXT_LEVEL,
			)
		}

		// Достижение "Марафон знаний" — пройти 5 курсов
		if (completedCourses >= 5) {
			await this.achievementService.grantAchievement(
				userId,
				Achievement.MARATHON_KNOWLEDGE,
			)
		}
	}
}
