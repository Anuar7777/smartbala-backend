import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class userDto {
	@IsOptional()
	@IsEmail()
	email?: string

	@IsOptional()
	@IsString()
	name?: string

	@IsOptional()
	@IsString()
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	password?: string
}

export class UpdateUserDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	username?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@MinLength(6)
	password?: string

	@ApiHideProperty()
	@IsOptional()
	@IsString()
	imageUrl?: string
}
