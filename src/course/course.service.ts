import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaClient, Role } from '@prisma/client'

@Injectable()
export class CourseService {
	private prisma = new PrismaClient()

	async getAll(userId: string, role: Role) {
		if (role === Role.PARENT) {
			return this.prisma.course.findMany({ include: { sections: true } })
		} else if (role === Role.CHILD) {
			const userCourses = await this.prisma.userCourse.findMany({
				where: {
					userId,
				},
				include: {
					course: {
						include: {
							sections: true,
						},
					},
				},
			})
			return userCourses.map(uc => uc.course)
		} else return []
	}

	async getById(courseId: string, userId: string, role: Role) {
		if (role === Role.PARENT) {
			return this.prisma.course.findUnique({
				where: { courseId },
				include: { sections: true },
			})
		} else if (role === Role.CHILD) {
			const userCourse = await this.prisma.userCourse.findUnique({
				where: { userId_courseId: { userId, courseId } },
				include: { course: { include: { sections: true } } },
			})
			if (!userCourse) return null
			return {
				...userCourse.course,
				completedSections: userCourse.completedSections,
				lastAccessed: userCourse.lastAccessed,
			}
		} else return null
	}

	// TODO: rewrite all this code to fit a universal format

	async get(courseId: string) {
		const course = await this.prisma.course.findUnique({
			where: { courseId },
		})

		if (!course) {
			throw new NotFoundException('Course not found')
		}

		return course
	}
}
