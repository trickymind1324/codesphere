import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { SubmissionService } from './submission.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly submissionService: SubmissionService,
  ) {}

  /** The signed-in user's own profile, creating an empty one on first access. */
  async getOwn(userId: string, displayName?: string): Promise<UserProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId, displayName: displayName ?? null, experience: [] });
      await this.profileRepo.save(profile);
    } else if (displayName && profile.displayName !== displayName) {
      // keep the display name in sync with the identity provider
      profile.displayName = displayName;
      await this.profileRepo.save(profile);
    }
    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto, displayName?: string): Promise<UserProfile> {
    const profile = await this.getOwn(userId, displayName);
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  /** Public, shareable view: profile fields + computed progress stats. */
  async getPublic(userId: string): Promise<{ profile: UserProfile | null; stats: any }> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    const stats = await this.submissionService.getUserStats(userId);
    return { profile, stats };
  }
}
