import { Test, TestingModule } from '@nestjs/testing'
import { PrismaClient, Role } from '@prisma/client'
import { SectionController } from '../src/section/section.controller'
import { SectionService } from '../src/section/section.service'
import { TestService } from '../src/test/test.service'
import { UserCourseService } from '../src/user/user-course/user-course.service'
import { PrismaService } from '../src/prisma.service'
import { clearDatabase } from './setup'

describe('SectionController (e2e)', () => {
	let sectionController: SectionController
	let prisma: PrismaClient

	beforeAll(async () => {
		prisma = new PrismaClient()

		const module: TestingModule = await Test.createTestingModule({
			controllers: [SectionController],
			providers: [
				SectionService,
				TestService,
				UserCourseService,
				{
					provide: PrismaService,
					useValue: prisma,
				},
			],
		}).compile()

		sectionController = module.get<SectionController>(SectionController)
	})

	afterAll(async () => {
		await clearDatabase()
		await prisma.$disconnect()
	})

	beforeEach(async () => {
		await prisma.test.deleteMany()
		await prisma.questionInstance.deleteMany()
		await prisma.questionTemplate.deleteMany()
		await prisma.section.deleteMany()
		await prisma.userCourse.deleteMany()
		await prisma.course.deleteMany()
		await prisma.user.deleteMany()
	})

	// helpers
	const createUser = async (id: string) => {
		return prisma.user.create({
			data: {
				userId: id,
				username: 'childUser',
				email: `${id}@mail.com`,
				password: '123',
				role: Role.CHILD,
			},
		})
	}

	const createCourse = async () => {
		return prisma.course.create({
			data: {
				title: 'Math',
				totalSections: 1,
			},
		})
	}

	const createSection = async (courseId: string) => {
		return prisma.section.create({
			data: {
				title: 'Algebra',
				courseId,
			},
		})
	}

	const createQuestion = async (sectionId: string) => {
		const template = await prisma.questionTemplate.create({
			data: {
				sectionId,
				text: 'Example question',
			},
		})

		await prisma.questionInstance.create({
			data: {
				templateId: template.templateId,
				answerOptions: ['A', 'B'],
				correctAnswer: 'A',
			},
		})
	}

	it('should generate a test from section', async () => {
		const user = await createUser('child-1')
		const course = await createCourse()
		const section = await createSection(course.courseId)

		// user must have entry in userCourse
		await prisma.userCourse.create({
			data: {
				userId: user.userId,
				courseId: course.courseId,
				completedSections: 0,
			},
		})

		// create question + instance
		await createQuestion(section.sectionId)

		// call controller
		const result = await sectionController.get(section.sectionId, user.userId)

		expect(result).toBeDefined()
		expect(result.questions).toHaveLength(1)
		expect(result.userId).toBe(user.userId)
		expect(result.sectionId).toBe(section.sectionId)
	})
})
