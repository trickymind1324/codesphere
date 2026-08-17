import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { SubmissionService } from '../services/submission.service';
import { BadgeService } from '../services/badge.service';
import { UpdateProfileDto, SetAvatarDto, SetResumeDto } from '../dto/update-profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly submissionService: SubmissionService,
    private readonly badgeService: BadgeService,
  ) {}

  private displayName(user: any): string | undefined {
    return user?.name || user?.preferred_username || user?.email;
  }

  private withHasResume(profile: any) {
    return { ...profile, hasResume: !!profile.resumeName };
  }

  /** The signed-in user's own profile (editable), with progress stats. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMine(@Request() req) {
    const userId = req.user.sub;
    const profile = await this.profileService.getOwn(userId, this.displayName(req.user));
    const stats = await this.submissionService.getUserStats(userId);
    const badges = await this.badgeService.computeBadges(userId);
    return { profile: this.withHasResume(profile), stats, badges, email: req.user.email, isOwner: true };
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMine(@Request() req, @Body() dto: UpdateProfileDto) {
    const profile = await this.profileService.update(
      req.user.sub,
      dto,
      this.displayName(req.user),
    );
    return { profile: this.withHasResume(profile) };
  }

  @Put('me/avatar')
  @UseGuards(JwtAuthGuard)
  async setAvatar(@Request() req, @Body() dto: SetAvatarDto) {
    await this.profileService.setAvatar(req.user.sub, dto.dataUrl, this.displayName(req.user));
    return { ok: true };
  }

  @Put('me/resume')
  @UseGuards(JwtAuthGuard)
  async setResume(@Request() req, @Body() dto: SetResumeDto) {
    await this.profileService.setResume(req.user.sub, dto.dataUrl, dto.fileName, this.displayName(req.user));
    return { ok: true };
  }

  @Delete('me/resume')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteResume(@Request() req) {
    await this.profileService.deleteResume(req.user.sub);
    return { ok: true };
  }

  /** Public, shareable profile — no email, viewable without signing in. */
  @Get(':userId')
  @UseGuards(OptionalAuthGuard)
  async getPublic(@Param('userId') userId: string, @Request() req) {
    const { profile, stats } = await this.profileService.getPublic(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const badges = await this.badgeService.computeBadges(userId);
    return { profile: this.withHasResume(profile), stats, badges, isOwner: req.user?.sub === userId };
  }

  /** Resume for preview/download — public. */
  @Get(':userId/resume')
  async getResume(@Param('userId') userId: string) {
    return this.profileService.getResume(userId);
  }
}
