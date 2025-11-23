import {
	Injectable,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { PrismaService } from '../../prisma.service'
import { FamilyService } from '../family.service'
import { UserCourseService } from '../../user/user-course/user-course.service'

@Injectable()
export class FamilyCourseService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly familyService: FamilyService,
		private readonly userCourseService: UserCourseService,
	) {}

	async get(parentFamilyId: string, childId: string, page = 1, limit = 15) {
		const isChildInFamily = await this.familyService.isUserInFamily(
			parentFamilyId,
			childId,
		)

		if (!isChildInFamily) {
			throw new NotFoundException('Child not found')
		}

		return this.userCourseService.getAll(childId, page, limit)
	}

	async getAvailableChildrenForCourse(familyId: string, courseId: string) {
		const family = await this.familyService.getFamilyById(familyId)

		const children = family.members.filter(
			member => member.role !== Role.PARENT,
		)
		// TODO: move it to courses
		const enrolledChildren = await this.prisma.userCourse.findMany({
			where: { courseId },
			select: { userId: true },
		})

		const enrolledIds = enrolledChildren.map(e => e.userId)

		const availableChildren = children.filter(
			child => !enrolledIds.includes(child.userId),
		)

		return availableChildren
	}

	async create(parentId: string, childId: string, courseId: string) {
		const parentMember = await this.prisma.familyMember.findFirst({
			where: { userId: parentId },
			include: { user: true },
		})
		if (!parentMember || parentMember.user.role !== Role.PARENT) {
			throw new ForbiddenException('Access denied: not a parent')
		}

		const childMember = await this.prisma.familyMember.findFirst({
			where: { familyId: parentMember.familyId, userId: childId },
			include: { user: true },
		})
		if (!childMember) {
			throw new NotFoundException('Child not found in your family')
		}

		const course = await this.prisma.course.findUnique({ where: { courseId } })
		if (!course) {
			throw new NotFoundException('Course not found')
		}

		const existing = await this.prisma.userCourse.findUnique({
			where: { userId_courseId: { userId: childId, courseId } },
		})
		if (existing) {
			return { message: 'Course already assigned to child' }
		}

		await this.prisma.userCourse.create({
			data: {
				userId: childId,
				courseId,
			},
		})

		return { message: 'Course successfully assigned to child' }
	}

	async delete(parentId: string, childId: string, courseId: string) {
		const parentMember = await this.prisma.familyMember.findFirst({
			where: { userId: parentId },
			include: { user: true },
		})
		if (!parentMember || parentMember.user.role !== Role.PARENT) {
			throw new ForbiddenException('Access denied: not a parent')
		}

		const childMember = await this.prisma.familyMember.findFirst({
			where: { familyId: parentMember.familyId, userId: childId },
			include: { user: true },
		})
		if (!childMember) {
			throw new NotFoundException('Child not found in your family')
		}

		const existing = await this.prisma.userCourse.findUnique({
			where: { userId_courseId: { userId: childId, courseId } },
		})
		if (!existing) {
			return { message: 'Course not assigned to child' }
		}

		await this.prisma.userCourse.delete({
			where: { userId_courseId: { userId: childId, courseId } },
		})

		return { message: 'Course successfully removed from child' }
	}
}
