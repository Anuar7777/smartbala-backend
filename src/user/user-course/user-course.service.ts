import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'
import { UserCourse } from '@prisma/client'

@Injectable()
export class UserCourseService {
	constructor(private readonly prisma: PrismaService) {}

	async get(userId: string, courseId: string) {
		const userCourse = await this.prisma.userCourse.findUnique({
			where: { userId_courseId: { userId, courseId } },
		})

		if (!userCourse) {
			throw new NotFoundException('Course not found')
		}

		return userCourse
	}

	async getAll(userId: string, page = 1, limit = 15) {
		const skip = (page - 1) * limit

		const [items, total] = await this.prisma.$transaction([
			this.prisma.userCourse.findMany({
				where: {
					userId,
					completedSections: {
						gt: 0,
					},
				},
				skip,
				take: limit,
				orderBy: {
					completedSections: 'asc',
				},
				select: {
					userId: true,
					courseId: true,
					completedSections: true,
					lastAccessed: true,
					course: true,
				},
			}),
			this.prisma.userCourse.count({
				where: {
					userId,
					completedSections: {
						gt: 0,
					},
				},
			}),
		])

		return {
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		}
	}

	async update(userId: string, courseId: string, dto: Partial<UserCourse>) {
		return this.prisma.userCourse.update({
			where: { userId_courseId: { userId, courseId } },
			data: dto,
		})
	}

	async updateProgress(userId: string, courseId: string) {
		return this.prisma.userCourse.update({
			where: { userId_courseId: { userId, courseId } },
			data: {
				completedSections: { increment: 1 },
			},
		})
	}
}
