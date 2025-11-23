import { Test, TestingModule } from '@nestjs/testing'
import { PrismaClient, Role, TestStatus } from '@prisma/client'
import { TestController } from '../src/test/test.controller'
import { TestService } from '../src/test/test.service'
import { UserCourseService } from '../src/user/user-course/user-course.service'
import { PrismaService } from '../src/prisma.service'
import { clearDatabase } from './setup'

describe('TestController (e2e)', () => {
	let testController: TestController
	let prisma: PrismaClient

	beforeAll(async () => {
		prisma = new PrismaClient()

		const module: TestingModule = await Test.createTestingModule({
			controllers: [TestController],
			providers: [
				TestService,
				UserCourseService,
				{
					provide: PrismaService,
					useValue: prisma,
				},
			],
		}).compile()

		testController = module.get<TestController>(TestController)
	})

	afterEach(async () => {
		await clearDatabase()
	})

	afterAll(async () => {
		await clearDatabase()
		await prisma.$disconnect()
	})

	// =======================
	// Хелперы для создания данных
	// =======================
	const createUser = async (userId: string, role: Role) => {
		return prisma.user.create({
			data: {
				userId,
				username: role + 'User',
				email: `${userId}@example.com`,
				password: 'password',
				role,
			},
		})
	}

	const createCourse = async (title: string) => {
		return prisma.course.create({
			data: { title, totalSections: 1 },
		})
	}

	const createSection = async (title: string, courseId: string) => {
		return prisma.section.create({
			data: { title, courseId },
		})
	}

	const createUserCourse = async (userId: string, courseId: string) => {
		return prisma.userCourse.create({
			data: { userId, courseId, completedSections: 0 },
		})
	}

	const createTest = async (
		userId: string,
		courseId: string,
		sectionId: string,
	) => {
		return prisma.test.create({
			data: {
				userId,
				courseId,
				sectionId,
				questions: [
					{
						text: 'Sample Question',
						instanceId: 'instance-1',
						templateId: 'template-1',
						answerOptions: ['A', 'B', 'C', 'D'],
						correctAnswer: 'A',
						explanation: null,
					},
				],
				status: TestStatus.PENDING,
				score: 0,
			},
		})
	}

	// =======================
	// Тесты
	// =======================
	it('should get all completed tests for a user', async () => {
		const user = await createUser('child-1', Role.CHILD)
		const course = await createCourse('Math')
		const section = await createSection('Algebra', course.courseId)

		await createTest(user.userId, course.courseId, section.sectionId)
		await prisma.test.updateMany({
			where: { userId: user.userId },
			data: { status: TestStatus.PASSED, score: 100 },
		})

		const tests = await testController.getAll(user.userId)
		expect(tests).toHaveLength(1)
		expect(tests[0].status).toBe(TestStatus.PASSED)
	})

	it('should get test by ID', async () => {
		const user = await createUser('child-1', Role.CHILD)
		const course = await createCourse('Science')
		const section = await createSection('Biology', course.courseId)
		const test = await createTest(
			user.userId,
			course.courseId,
			section.sectionId,
		)

		const foundTest = await testController.get(test.testId)
		expect(foundTest).not.toBeNull()
		expect(foundTest.testId).toBe(test.testId)
	})

	it('should submit a test and calculate score', async () => {
		const user = await createUser('child-1', Role.CHILD)
		const course = await createCourse('Math')
		const section = await createSection('Algebra', course.courseId)
		const test = await createTest(
			user.userId,
			course.courseId,
			section.sectionId,
		)

		// ❗ Создаём userCourse для FK
		await createUserCourse(user.userId, course.courseId)

		const submitDto = {
			answers: [
				{
					instanceId: 'instance-1',
					templateId: 'template-1',
					userAnswer: 'A',
				},
			],
		}

		const result = await testController.submit(
			test.testId,
			user.userId,
			submitDto,
		)

		expect(result.status).toBe(TestStatus.PASSED)
		expect(result.score).toBe(100)

		const results = result.results as Array<{ userAnswer: string }>

		expect(results).toHaveLength(1)
		expect(results[0].userAnswer).toBe('A')
	})

	it('should throw error when submitting already submitted test', async () => {
		const user = await createUser('child-1', Role.CHILD)
		const course = await createCourse('Math')
		const section = await createSection('Algebra', course.courseId)
		const test = await createTest(
			user.userId,
			course.courseId,
			section.sectionId,
		)

		// ❗ Создаём userCourse для FK
		await createUserCourse(user.userId, course.courseId)

		// вручную ставим статус завершенного теста
		await prisma.test.update({
			where: { testId: test.testId },
			data: { status: TestStatus.PASSED },
		})

		const submitDto = {
			answers: [
				{ instanceId: 'instance-1', templateId: 'template-1', userAnswer: 'A' },
			],
		}

		await expect(
			testController.submit(test.testId, user.userId, submitDto),
		).rejects.toThrow('Test has already been submitted')
	})
})
