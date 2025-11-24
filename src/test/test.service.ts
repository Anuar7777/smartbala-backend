import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Prisma, TestStatus } from '@prisma/client'
import {
	QuestionTemplatesWithPayload,
	SectionWithPayload,
	TestAnswer,
	TestQuestion,
} from '../section/section.types'
import { UserCourseService } from '../user/user-course/user-course.service'
import { UserService } from '../user/user.service'
import { AchievementCheckService } from '../achievement/achievement-check.service'

@Injectable()
export class TestService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService,
		private readonly userCourseService: UserCourseService,
		private readonly achievementCheckService: AchievementCheckService,
	) {}

	async get(testId: string) {
		const test = await this.prisma.test.findUnique({
			where: {
				testId,
			},
		})

		if (!test) {
			throw new NotFoundException('Test not found')
		}

		return test
	}

	private generateQuestions(templates: QuestionTemplatesWithPayload[]) {
		return templates.map(template => {
			const instances = template.instances
			const instance = instances[Math.floor(Math.random() * instances.length)]

			let text = template.text
			let explanation = template.explanation ?? null

			if (instance.variables) {
				for (const [key, value] of Object.entries(
					instance.variables as Record<string, unknown>,
				)) {
					const re = new RegExp(`{${key}}`, 'g')
					text = text.replace(re, String(value))
					if (explanation) explanation = explanation.replace(re, String(value))
				}
			}

			return {
				templateId: template.templateId,
				instanceId: instance.instanceId,
				text,
				explanation,
				answerOptions: instance.answerOptions,
				correctAnswer: instance.correctAnswer,
			}
		})
	}

	async generate(section: SectionWithPayload, userId: string) {
		const questions = this.generateQuestions(section.questionTemplates)

		const test = await this.prisma.test.create({
			data: {
				sectionId: section.sectionId,
				userId,
				questions,
				status: TestStatus.PENDING,
				courseId: section.courseId,
			},
		})

		return test
	}

	async getAll(userId: string) {
		return this.prisma.test.findMany({
			where: {
				userId,
				status: {
					not: TestStatus.PENDING,
				},
			},
			select: {
				testId: true,
				results: true,
				status: true,
				score: true,
				updatedAt: true,
				sectionId: true,
				userId: true,
			},
		})
	}

	async submit(testId: string, userId: string, answers: TestAnswer[]) {
		const test = await this.get(testId)

		if (test.status !== TestStatus.PENDING) {
			throw new BadRequestException('Test has already been submitted')
		}

		const questions = test.questions as unknown as TestQuestion[]

		const { results, score, status } = this.calculateResults(questions, answers)

		if (status === TestStatus.PASSED) {
			await this.userCourseService.updateProgress(userId, test.courseId)
			await this.userService.updatePoints(userId, Math.round(score / 10))
			await this.achievementCheckService.checkCourseAchievements(
				userId,
				test.courseId,
			)
			await this.achievementCheckService.checkTestAchievements(userId, testId)
		}

		return this.prisma.test.update({
			where: { testId, userId },
			data: {
				status,
				results,
				score,
			},
			select: {
				status: true,
				score: true,
				results: true,
			},
		})
	}

	private calculateResults(questions: TestQuestion[], answers: TestAnswer[]) {
		let correctCount = 0
		const total = questions.length

		const results = questions.map(question => {
			const userAnswer =
				answers.find(answer => answer.instanceId === question.instanceId)
					?.userAnswer ?? null

			if (userAnswer === question.correctAnswer) correctCount++

			const { text, correctAnswer } = question

			return { text, correctAnswer, userAnswer }
		}) as unknown as Prisma.InputJsonValue

		const score = Math.round((correctCount / total) * 100)
		const status = score >= 85 ? TestStatus.PASSED : TestStatus.FAILED

		return { results, score, status }
	}
}
