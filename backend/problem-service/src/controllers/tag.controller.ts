import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../controllers/problem.controller';
import { IsString, IsOptional } from 'class-validator';

class CreateTagDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

@Controller('tags')
export class TagController {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  /**
   * Get all tags
   */
  @Get()
  async findAll() {
    return this.tagRepository.find({
      order: { problemCount: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Get a single tag
   */
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.tagRepository.findOne({
      where: { slug },
      relations: ['problems'],
    });
  }

  /**
   * Create a new tag (admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  async create(@Body() createTagDto: CreateTagDto) {
    const tag = this.tagRepository.create(createTagDto);
    await this.tagRepository.save(tag);
    return {
      message: 'Tag created successfully',
      tag,
    };
  }

  /**
   * Update a tag (admin only)
   */
  @Put(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  async update(@Param('slug') slug: string, @Body() updateTagDto: Partial<CreateTagDto>) {
    const tag = await this.tagRepository.findOne({ where: { slug } });
    if (!tag) {
      throw new Error('Tag not found');
    }

    Object.assign(tag, updateTagDto);
    await this.tagRepository.save(tag);

    return {
      message: 'Tag updated successfully',
      tag,
    };
  }

  /**
   * Delete a tag (admin only)
   */
  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('slug') slug: string) {
    const tag = await this.tagRepository.findOne({ where: { slug } });
    if (!tag) {
      throw new Error('Tag not found');
    }

    await this.tagRepository.remove(tag);
  }
}
