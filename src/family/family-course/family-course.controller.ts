import {
	Controller,
	DefaultValuePipe,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
	Post,
	Query,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { Auth } from '../../auth/decorators/auth.decorator'
import { CurrentUser } from '../../auth/decorators/user.decorator'
import { IsParent } from '../../auth/decorators/roles.decorator'
import { FamilyCourseService } from './family-course.service'

@ApiTags('Family - Courses')
@ApiBearerAuth()
@IsParent()
@Auth()
@Controller('family/child')
export class FamilyCourseController {
	constructor(private readonly familyCourseService: FamilyCourseService) {}

	@HttpCode(200)
	@Get(':childId/course')
	@ApiOperation({ summary: 'Get all courses assigned to a child' })
	@ApiResponse({
		status: 200,
		description: 'List of courses successfully retrieved',
	})
	@ApiResponse({
		status: 404,
		description: 'Child not found or does not belong to this parent',
	})
	@ApiParam({
		name: 'childId',
		example: 'd12bec0e-423e-400b-8ba4-9e81c1b382b4',
		description: 'The ID of the child whose courses are being requested',
	})
	async get(
		@CurrentUser('family_id') parentFamilyId: string,
		@Param('childId') childId: string,
		@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
		@Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number = 15,
	) {
		return this.familyCourseService.get(parentFamilyId, childId, page, limit)
	}

	@HttpCode(200)
	@Post(':childId/course/:courseId')
	@ApiOperation({ summary: 'Assign course to child' })
	@ApiResponse({
		status: 200,
		description: 'Course successfully assigned to child',
	})
	@ApiResponse({ status: 404, description: 'Course or child not found' })
	@ApiParam({
		name: 'childId',
		example: 'd12bec0e-423e-400b-8ba4-9e81c1b382b4',
		description: 'The ID of the child',
	})
	@ApiParam({
		name: 'courseId',
		example: '8a7b1c2d-3e4f-5678-9012-abcdef123456',
		description: 'The ID of the course to assign',
	})
	async create(
		@CurrentUser('id') parentId: string,
		@Param('childId') childId: string,
		@Param('courseId') courseId: string,
	) {
		return this.familyCourseService.create(parentId, childId, courseId)
	}

	@HttpCode(200)
	@Delete(':childId/course/:courseId')
	@ApiOperation({ summary: 'Remove course from child' })
	@ApiResponse({
		status: 200,
		description: 'Course successfully removed from child',
	})
	@ApiResponse({ status: 404, description: 'Course not found for this child' })
	@ApiParam({
		name: 'childId',
		example: 'd12bec0e-423e-400b-8ba4-9e81c1b382b4',
		description: 'The ID of the child',
	})
	@ApiParam({
		name: 'courseId',
		example: '8a7b1c2d-3e4f-5678-9012-abcdef123456',
		description: 'The ID of the course to remove',
	})
	async delete(
		@CurrentUser('id') parentId: string,
		@Param('childId') childId: string,
		@Param('courseId') courseId: string,
	) {
		return this.familyCourseService.delete(parentId, childId, courseId)
	}

	@HttpCode(200)
	@Get('course/:courseId/available')
	@ApiOperation({
		summary:
			'Get all children in the family who are not enrolled in a specific course',
	})
	@ApiResponse({
		status: 200,
		description: 'List of children not enrolled in the specified course',
	})
	@ApiResponse({
		status: 404,
		description: 'Family not found for this parent or invalid course ID',
	})
	@ApiParam({
		name: 'courseId',
		example: '8a7b1c2d-3e4f-5678-9012-abcdef123456',
		description: 'The ID of the course',
	})
	async getAvailableChildrenForCourse(
		@CurrentUser('family_id') familyId: string,
		@Param('courseId') courseId: string,
	) {
		return this.familyCourseService.getAvailableChildrenForCourse(
			familyId,
			courseId,
		)
	}
}
