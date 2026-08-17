import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { SubmissionService } from './submission.service';

const MAX_AVATAR_BYTES = 400 * 1024; // ~400KB (client resizes first)
const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB

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

  private base64Bytes(dataUrl: string): number {
    const comma = dataUrl.indexOf(',');
    const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    return Math.floor((b64.length * 3) / 4);
  }

  async setAvatar(userId: string, dataUrl: string, displayName?: string): Promise<void> {
    if (!dataUrl.startsWith('data:image/')) {
      throw new BadRequestException('Avatar must be an image');
    }
    if (this.base64Bytes(dataUrl) > MAX_AVATAR_BYTES) {
      throw new BadRequestException('Image is too large');
    }
    const profile = await this.getOwn(userId, displayName);
    profile.avatarUrl = dataUrl;
    await this.profileRepo.save(profile);
  }

  async setResume(userId: string, dataUrl: string, fileName: string, displayName?: string): Promise<void> {
    if (!dataUrl.startsWith('data:application/pdf')) {
      throw new BadRequestException('Resume must be a PDF');
    }
    if (this.base64Bytes(dataUrl) > MAX_RESUME_BYTES) {
      throw new BadRequestException('Resume is too large (max 5MB)');
    }
    const profile = await this.getOwn(userId, displayName);
    profile.resumeData = dataUrl;
    profile.resumeName = fileName;
    await this.profileRepo.save(profile);
  }

  async deleteResume(userId: string): Promise<void> {
    await this.profileRepo.update({ userId }, { resumeData: null, resumeName: null });
  }

  /** Fetch the resume (data URL) for preview/download; public. */
  async getResume(userId: string): Promise<{ fileName: string; dataUrl: string }> {
    const row = await this.profileRepo
      .createQueryBuilder('p')
      .addSelect('p.resumeData')
      .where('p.userId = :userId', { userId })
      .getOne();
    if (!row?.resumeData) {
      throw new NotFoundException('No resume on file');
    }
    return { fileName: row.resumeName ?? 'resume.pdf', dataUrl: row.resumeData };
  }
}
