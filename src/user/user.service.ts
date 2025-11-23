import { Injectable, NotFoundException } from '@nestjs/common'
import { Role, User } from '@prisma/client'
import { hash } from 'argon2'
import { RegisterDto } from '../auth/dto/auth.dto'
import { PrismaService } from '../prisma.service'

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async getById(id: string) {
		return this.prisma.user.findUnique({
			where: {
				userId: id,
			},
		})
	}

	async getByEmail(email: string): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { email },
		})
	}

	async getAll() {
		return this.prisma.user.findMany({
			select: {
				userId: true,
				username: true,
				imageUrl: true,
				points: true,
			},
		})
	}

	async getTopUsers(limit = 25) {
		return this.prisma.user.findMany({
			where: {
				role: { not: Role.PARENT },
			},
			select: {
				userId: true,
				username: true,
				imageUrl: true,
				points: true,
			},
			orderBy: { points: 'desc' },
			take: limit,
		})
	}

	async updatePoints(userId: string, points: number) {
		const user = await this.prisma.user.update({
			where: { userId },
			data: {
				points: {
					increment: points,
				},
			},
		})

		return user
	}

	async updatePassword(userId: string, newPassword: string) {
		const user = await this.prisma.user.update({
			where: { userId },
			data: { password: newPassword },
		})

		return user
	}

	async getProfile(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { userId },
			select: {
				userId: true,
				username: true,
				email: true,
				role: true,
				points: true,
				imageUrl: true,
				Settings: true,
			},
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		return user
	}

	async create(dto: RegisterDto) {
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				username: dto.username,
				password: await hash(dto.password),
				role: dto.role,
			},
		})
		return user
	}

	async markVerified(userId: string) {
		return this.prisma.user.update({
			where: { userId },
			data: { isVerified: true },
		})
	}
}
