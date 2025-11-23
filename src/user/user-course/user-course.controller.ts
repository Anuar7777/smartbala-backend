import {
	Controller,
	DefaultValuePipe,
	Get,
	HttpCode,
	ParseIntPipe,
	Query,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { Auth } from '../../auth/decorators/auth.decorator'
import { CurrentUser } from '../../auth/decorators/user.decorator'
import { UserCourseService } from './user-course.service'

@ApiTags('User - Courses')
@ApiBearerAuth()
@Auth()
@Controller('user/courses')
export class UserCourseController {
	constructor(private readonly userCourseService: UserCourseService) {}

	@HttpCode(200)
	@Get()
	@ApiOperation({
		summary: 'Get all courses for the current user',
	})
	@ApiResponse({
		status: 200,
		description: 'List of user courses returned successfully',
	})
	async getAll(
		@CurrentUser('id') userId: string,
		@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
		@Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number = 15,
	) {
		return this.userCourseService.getAll(userId, page, limit)
	}
}
