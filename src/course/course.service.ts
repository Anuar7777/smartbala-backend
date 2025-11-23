import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaClient, Role } from '@prisma/client'

@Injectable()
export class CourseService {
	private prisma = new PrismaClient()

	async getAll(userId: string, role: Role, page = 1, limit = 10) {
		const skip = (page - 1) * limit

		if (role === Role.PARENT) {
			const [items, total] = await this.prisma.$transaction([
				this.prisma.course.findMany({
					skip,
					take: limit,
					include: {
						sections: true,
					},
				}),
				this.prisma.course.count(),
			])

			return {
				items,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			}
		}

		if (role === Role.CHILD) {
			const [userCourses, total] = await this.prisma.$transaction([
				this.prisma.userCourse.findMany({
					where: { userId },
					skip,
					take: limit,
					include: {
						course: {
							include: { sections: true },
						},
					},
				}),
				this.prisma.userCourse.count({
					where: { userId },
				}),
			])

			return {
				items: userCourses.map(uc => uc.course),
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			}
		}

		return {
			items: [],
			total: 0,
			page,
			limit,
			totalPages: 0,
		}
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
