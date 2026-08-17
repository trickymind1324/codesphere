import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../entities/submission.entity';

export interface Badge {
  id: string;
  category: 'problem-solving' | 'language' | 'days';
  label: string;
  symbol: string; // short text shown in the hexagon (e.g. "Py", "30", "PS")
  level: 'bronze' | 'silver' | 'gold';
  stars: number; // 1..5
  points: number;
  pointsToNext: number | null; // to the next star; null when maxed
  description: string; // shown in the hover card
}

const DIFFICULTY_POINTS: Record<string, number> = { easy: 10, medium: 25, hard: 50 };

const LANGUAGE_LABELS: Record<string, { label: string; symbol: string }> = {
  python: { label: 'Python', symbol: 'Py' },
  javascript: { label: 'JavaScript', symbol: 'JS' },
  typescript: { label: 'TypeScript', symbol: 'TS' },
  java: { label: 'Java', symbol: 'Jv' },
  cpp: { label: 'C++', symbol: 'C++' },
  c: { label: 'C', symbol: 'C' },
  go: { label: 'Go', symbol: 'Go' },
  sql: { label: 'SQL', symbol: 'SQL' },
};

function tierFromStars(stars: number): Badge['level'] {
  if (stars >= 5) return 'gold';
  if (stars >= 3) return 'silver';
  return 'bronze';
}

/** Given earned points and per-star thresholds, resolve stars + gap to next. */
function grade(points: number, thresholds: number[]): { stars: number; pointsToNext: number | null } {
  let stars = 0;
  for (const t of thresholds) if (points >= t) stars += 1;
  const next = thresholds[stars];
  return { stars, pointsToNext: next != null ? next - points : null };
}

const PS_THRESHOLDS = [50, 150, 350, 700, 1200];
const LANG_THRESHOLDS = [20, 60, 120, 220, 360];
const DAY_THRESHOLDS = [1, 5, 10, 20, 30];

@Injectable()
export class BadgeService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
  ) {}

  /** Badges the user has actually earned, computed from their submissions. */
  async computeBadges(userId: string): Promise<Badge[]> {
    const rows = await this.submissionRepo
      .createQueryBuilder('s')
      .leftJoin('problems', 'p', 'p.id = s."problemId"')
      .select([
        's."problemId" AS "problemId"',
        's.language AS language',
        's.status AS status',
        's."createdAt" AS "createdAt"',
        'p.difficulty AS difficulty',
      ])
      .where('s."userId" = :userId', { userId })
      .getRawMany<{ problemId: string; language: string; status: string; createdAt: Date; difficulty: string }>();

    const badges: Badge[] = [];

    // Distinct solved problems (accepted), for problem-solving + languages
    const solvedByLang = new Map<string, Set<string>>();
    const solvedProblems = new Map<string, string>(); // problemId -> difficulty
    const activeDays = new Set<string>();

    for (const r of rows) {
      if (r.createdAt) activeDays.add(new Date(r.createdAt).toISOString().slice(0, 10));
      if (r.status === 'accepted') {
        solvedProblems.set(r.problemId, (r.difficulty || 'easy').toLowerCase());
        const lang = (r.language || '').toLowerCase();
        if (!solvedByLang.has(lang)) solvedByLang.set(lang, new Set());
        solvedByLang.get(lang)!.add(r.problemId);
      }
    }

    // Problem Solving badge
    let psPoints = 0;
    for (const diff of solvedProblems.values()) psPoints += DIFFICULTY_POINTS[diff] ?? 10;
    if (psPoints > 0) {
      const { stars, pointsToNext } = grade(psPoints, PS_THRESHOLDS);
      badges.push({
        id: 'problem-solving',
        category: 'problem-solving',
        label: 'Problem Solving',
        symbol: 'PS',
        level: tierFromStars(stars),
        stars: Math.max(stars, 1),
        points: psPoints,
        pointsToNext,
        description: `You have solved ${solvedProblems.size} problem${solvedProblems.size === 1 ? '' : 's'} so far`,
      });
    }

    // Per-language badges
    for (const [lang, problems] of solvedByLang) {
      const meta = LANGUAGE_LABELS[lang];
      if (!meta) continue;
      const points = problems.size * 20;
      const { stars, pointsToNext } = grade(points, LANG_THRESHOLDS);
      badges.push({
        id: `language-${lang}`,
        category: 'language',
        label: meta.label,
        symbol: meta.symbol,
        level: tierFromStars(stars),
        stars: Math.max(stars, 1),
        points,
        pointsToNext,
        description: `You have solved ${problems.size} problem${problems.size === 1 ? '' : 's'} in ${meta.label}`,
      });
    }

    // Days of Code badge
    if (activeDays.size > 0) {
      const days = activeDays.size;
      const { stars, pointsToNext } = grade(days, DAY_THRESHOLDS);
      badges.push({
        id: 'days-of-code',
        category: 'days',
        label: 'Days of Code',
        symbol: String(days),
        level: tierFromStars(stars),
        stars: Math.max(stars, 1),
        points: days,
        pointsToNext,
        description: `You have been active on ${days} day${days === 1 ? '' : 's'}`,
      });
    }

    // strongest first
    return badges.sort((a, b) => b.stars - a.stars || b.points - a.points);
  }
}
