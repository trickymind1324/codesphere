import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { SubmissionService } from '../services/submission.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly submissionService: SubmissionService,
  ) {}

  private displayName(user: any): string | undefined {
    return user?.name || user?.preferred_username || user?.email;
  }

  /** The signed-in user's own profile (editable), with progress stats. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMine(@Request() req) {
    const userId = req.user.sub;
    const profile = await this.profileService.getOwn(userId, this.displayName(req.user));
    const stats = await this.submissionService.getUserStats(userId);
    return { profile, stats, email: req.user.email, isOwner: true };
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMine(@Request() req, @Body() dto: UpdateProfileDto) {
    const profile = await this.profileService.update(
      req.user.sub,
      dto,
      this.displayName(req.user),
    );
    return { profile };
  }

  /** Public, shareable profile — no email, viewable without signing in. */
  @Get(':userId')
  @UseGuards(OptionalAuthGuard)
  async getPublic(@Param('userId') userId: string, @Request() req) {
    const { profile, stats } = await this.profileService.getPublic(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return { profile, stats, isOwner: req.user?.sub === userId };
  }
}
