import {
	Body,
	Controller,
	Get,
	HttpCode,
	Put,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { UserService } from './user.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiBody,
	ApiConsumes,
} from '@nestjs/swagger'
import { UpdateUserDto } from './dto/user.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'

@ApiTags('User')
@ApiBearerAuth()
@Auth()
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@HttpCode(200)
	@Get('profile')
	@ApiOperation({ summary: 'Get current user profile' })
	@ApiResponse({
		status: 200,
		description: 'Successfully retrieved user profile',
	})
	@ApiResponse({
		status: 404,
		description: 'User not found',
	})
	async profile(@CurrentUser('id') userId: string) {
		return this.userService.getProfile(userId)
	}

	@Put('profile')
	@UseInterceptors(
		FileInterceptor('image', {
			storage: diskStorage({
				destination: (req, file, cb) => {
					cb(null, './public/images/users')
				},
				filename: (
					req: Request<
						ParamsDictionary,
						any,
						any,
						ParsedQs,
						Record<string, any>
					>,
					file: Express.Multer.File,
					cb: (error: Error | null, filename: string) => void,
				) => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					const user = (req as any).user
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					if (!user?.id) return cb(new Error('User not found'), '')
					const fileExt = extname(file.originalname)
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					cb(null, `${user.id}${fileExt}`)
				},
			}),
			fileFilter: (req, file, cb) => {
				const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
				if (!allowedTypes.includes(file.mimetype)) {
					return cb(new Error('Invalid file type'), false)
				}
				cb(null, true)
			},
			limits: { fileSize: 5 * 1024 * 1024 },
		}),
	)
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Profile data',
		schema: {
			type: 'object',
			properties: {
				username: { type: 'string', example: 'Aigul' },
				password: { type: 'string', example: 'password123' },
				image: {
					type: 'string',
					format: 'binary',
					description: 'Profile image',
				},
			},
		},
	})
	@ApiOperation({ summary: 'Update user profile' })
	@ApiResponse({ status: 200, description: 'Profile updated successfully' })
	@ApiResponse({ status: 404, description: 'User not found' })
	async updateProfile(
		@CurrentUser('id') userId: string,
		@Body() dto: UpdateUserDto,
		@UploadedFile() image?: Express.Multer.File,
	) {
		const imagePath = image ? `/images/users/${image.filename}` : undefined
		return this.userService.updateProfile(userId, dto, imagePath)
	}
}
