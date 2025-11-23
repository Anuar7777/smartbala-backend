import { Test, TestingModule } from '@nestjs/testing'
import { PrismaClient, Role, TestStatus } from '@prisma/client'
import { AchievementController } from '../src/achievement/achievement.controller'
import { AchievementService } from '../src/achievement/achievement.service'
import { AchievementCheckService } from '../src/achievement/achievement-check.service'
import { TestService } from '../src/test/test.service'
import { UserCourseService } from '../src/user/user-course/user-course.service'
import { PrismaService } from '../src/prisma.service'
import {
	Achievement,
	AchievementSeed,
} from '../src/achievement/achievement.data'
import { clearDatabase } from './setup'

describe('AchievementController (e2e)', () => {
	let controller: AchievementController
	let prisma: PrismaClient
	let achievementCheck: AchievementCheckService

	beforeAll(async () => {
		prisma = new PrismaClient()

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AchievementController],
			providers: [
				AchievementService,
				AchievementCheckService,
				TestService,
				UserCourseService,
				{
					provide: PrismaService,
					useValue: prisma,
				},
			],
		}).compile()

		controller = module.get(AchievementController)
		achievementCheck = module.get(AchievementCheckService)
	})

	beforeAll(async () => {
		const achievementData: AchievementSeed[] = [
			{
				achievementId: 'db3f7cf9-b050-4553-ba19-0fdd8a417496',
				achievementIconUrl: '/public/images/achievements/first_step.svg',
				achievementBody: {
					ru: {
						title: 'Первый шаг',
						description: 'Успешно пройти первый тест',
					},
					en: {
						title: 'First Step',
						description: 'Successfully complete your first test',
					},
					kz: {
						title: 'Бірінші қадам',
						description: 'Бірінші тестті сәтті орындау',
					},
				},
			},
			{
				achievementId: '98a9a510-452b-4b63-aaf7-746eb534d849',
				achievementIconUrl: '/public/images/achievements/three_in_row.svg',
				achievementBody: {
					ru: {
						title: 'Готов к следующему уровню',
						description: 'Пройти три курса',
					},
					en: {
						title: 'Ready for the Next Level',
						description: 'Complete three courses',
					},
					kz: {
						title: 'Келесі деңгейге дайынмын',
						description: 'Үш курсты аяқтау',
					},
				},
			},
			{
				achievementId: '609fbf9d-3378-4003-b453-bc661c28cbec',
				achievementIconUrl: '/public/images/achievements/no_mistakes.svg',
				achievementBody: {
					ru: { title: 'Высший балл', description: 'Пройти тест без ошибок' },
					en: {
						title: 'Perfect Score',
						description: 'Complete a test without mistakes',
					},
					kz: { title: 'Мінсіз нәтиже', description: 'Тестті қатесіз өту' },
				},
			},
			{
				achievementId: 'b885773d-9322-4315-a49f-2e5357370d2f',
				achievementIconUrl: '/public/images/achievements/books.svg',
				achievementBody: {
					ru: { title: 'Марафон знаний', description: 'Пройти 5 курсов' },
					en: {
						title: 'Marathon Knowledge',
						description: 'Complete 5 courses',
					},
					kz: { title: 'Білім марафоны', description: '5 курсты толық бітіру' },
				},
			},
		]

		await prisma.achievement.createMany({
			data: achievementData,
			skipDuplicates: true,
		})
	})

	afterAll(async () => {
		await clearDatabase()
		await prisma.$disconnect()
	})

	// =======================
	// Хелперы
	// =======================
	const createUser = async (userId: string, role: Role) =>
		prisma.user.create({
			data: {
				userId,
				username: `${role}-user`,
				email: `${userId}@mail.com`,
				password: 'pass',
				role,
			},
		})

	const createCourse = async (title: string) =>
		prisma.course.create({
			data: { title, totalSections: 3 },
		})

	const createUserCourse = async (
		userId: string,
		courseId: string,
		completed = 0,
	) =>
		prisma.userCourse.create({
			data: { userId, courseId, completedSections: completed },
		})

	const createSection = async (title: string, courseId: string) =>
		prisma.section.create({ data: { title, courseId } })

	const createTest = (userId: string, courseId: string, sectionId: string) =>
		prisma.test.create({
			data: {
				userId,
				courseId,
				sectionId,
				status: TestStatus.PASSED,
				score: 100,
				questions: [
					{
						text: 'Q',
						instanceId: 'i1',
						templateId: 't1',
						answerOptions: ['A'],
						correctAnswer: 'A',
						explanation: null,
					},
				],
			},
		})

	// =======================
	// ТЕСТЫ
	// =======================

	it('should return all achievements (list size = 4)', async () => {
		const achievements = await controller.getAll()
		expect(achievements.length).toBe(4)
	})

	it('should return empty achievements for new user', async () => {
		const user = await createUser('u1', Role.CHILD)

		const my = await controller.getMyAchievements(user.userId)
		expect(my).toHaveLength(0)
	})

	it('should grant PERFECT_SCORE after 100% test', async () => {
		const user = await createUser('child1', Role.CHILD)
		const course = await createCourse('Math')
		const section = await createSection('S1', course.courseId)
		const test = await createTest(
			user.userId,
			course.courseId,
			section.sectionId,
		)

		await achievementCheck.checkTestAchievements(user.userId, test.testId)

		const res = await controller.getMyAchievements(user.userId)

		expect(res).toHaveLength(1)
		expect(res[0].achievementId).toBe(Achievement.PERFECT_SCORE)
	})

	it('should grant FIRST_STEP after first completed test in a course', async () => {
		const user = await createUser('child2', Role.CHILD)
		const course = await createCourse('Science')
		const section = await createSection('Bio', course.courseId)

		await createUserCourse(user.userId, course.courseId)

		await createTest(user.userId, course.courseId, section.sectionId)

		await achievementCheck.checkCourseAchievements(user.userId, course.courseId)

		const list = await controller.getMyAchievements(user.userId)

		expect(
			list.some(a => a.achievementId === String(Achievement.FIRST_STEP)),
		).toBe(true)
	})

	it('should grant READY_FOR_NEXT_LEVEL after completing 3 courses', async () => {
		const user = await createUser('child3', Role.CHILD)

		for (let i = 0; i < 3; i++) {
			const course = await createCourse('C' + i)
			await createUserCourse(user.userId, course.courseId, 3)
			await achievementCheck.checkCourseAchievements(
				user.userId,
				course.courseId,
			)
		}

		const list = await controller.getMyAchievements(user.userId)
		expect(
			list.some(
				a => a.achievementId === String(Achievement.READY_FOR_NEXT_LEVEL),
			),
		).toBe(true)
	})

	it('should grant MARATHON_KNOWLEDGE after completing 5 courses', async () => {
		const user = await createUser('child4', Role.CHILD)

		for (let i = 0; i < 5; i++) {
			const course = await createCourse('X' + i)
			await createUserCourse(user.userId, course.courseId, 3)
			await achievementCheck.checkCourseAchievements(
				user.userId,
				course.courseId,
			)
		}

		const list = await controller.getMyAchievements(user.userId)
		expect(
			list.some(
				a => a.achievementId === String(Achievement.MARATHON_KNOWLEDGE),
			),
		).toBe(true)
	})

	it('should not duplicate achievements when conditions are triggered twice', async () => {
		const user = await createUser('dup', Role.CHILD)

		const course = await createCourse('TestCourse')
		await createUserCourse(user.userId, course.courseId, 3)

		const section = await prisma.section.create({
			data: { title: 'S1', courseId: course.courseId },
		})

		await prisma.test.create({
			data: {
				userId: user.userId,
				courseId: course.courseId,
				sectionId: section.sectionId,
				status: TestStatus.PASSED,
				score: 100,
				questions: [
					{
						text: 'Q',
						instanceId: 'i1',
						templateId: 't1',
						answerOptions: ['A'],
						correctAnswer: 'A',
						explanation: null,
					},
				],
			},
		})

		// первый раз
		await achievementCheck.checkCourseAchievements(user.userId, course.courseId)

		// второй раз (дубликат ситуации)
		await achievementCheck.checkCourseAchievements(user.userId, course.courseId)

		const list = await controller.getMyAchievements(user.userId)

		expect(
			list.filter(a => a.achievementId === String(Achievement.FIRST_STEP))
				.length,
		).toBe(1)
	})

	it('should NOT grant PERFECT_SCORE if test score < 100%', async () => {
		const user = await createUser('neg1', Role.CHILD)
		const course = await createCourse('Math')
		const section = await createSection('S1', course.courseId)

		const test = await prisma.test.create({
			data: {
				userId: user.userId,
				courseId: course.courseId,
				sectionId: section.sectionId,
				status: TestStatus.PASSED,
				score: 80, // меньше 100%
				questions: [
					{
						text: 'Q',
						instanceId: 'i1',
						templateId: 't1',
						answerOptions: ['A'],
						correctAnswer: 'A',
						explanation: null,
					},
				],
			},
		})

		await achievementCheck.checkTestAchievements(user.userId, test.testId)

		const list = await controller.getMyAchievements(user.userId)
		expect(list).toHaveLength(0)
	})

	it('should NOT grant FIRST_STEP if test status is FAILED', async () => {
		const user = await createUser('neg2', Role.CHILD)
		const course = await createCourse('Science')
		const section = await createSection('S1', course.courseId)

		await prisma.test.create({
			data: {
				userId: user.userId,
				courseId: course.courseId,
				sectionId: section.sectionId,
				status: TestStatus.FAILED, // FAILED
				score: 100,
				questions: [
					{
						text: 'Q',
						instanceId: 'i1',
						templateId: 't1',
						answerOptions: ['A'],
						correctAnswer: 'A',
						explanation: null,
					},
				],
			},
		})

		await achievementCheck.checkCourseAchievements(user.userId, course.courseId)

		const list = await controller.getMyAchievements(user.userId)
		expect(
			list.some(a => a.achievementId === String(Achievement.FIRST_STEP)),
		).toBe(false)
	})

	it('should NOT grant READY_FOR_NEXT_LEVEL or MARATHON_KNOWLEDGE if not enough courses completed', async () => {
		const user = await createUser('neg3', Role.CHILD)

		// создаём только 2 завершённых курса вместо 3+
		for (let i = 0; i < 2; i++) {
			const course = await createCourse('C' + i)
			await createUserCourse(user.userId, course.courseId, 3)
			await achievementCheck.checkCourseAchievements(
				user.userId,
				course.courseId,
			)
		}

		const list = await controller.getMyAchievements(user.userId)
		expect(
			list.some(
				a => a.achievementId === String(Achievement.READY_FOR_NEXT_LEVEL),
			),
		).toBe(false)
		expect(
			list.some(
				a => a.achievementId === String(Achievement.MARATHON_KNOWLEDGE),
			),
		).toBe(false)
	})
})
