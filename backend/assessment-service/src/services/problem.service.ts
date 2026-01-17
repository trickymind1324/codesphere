import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ProblemDetails {
  id: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

@Injectable()
export class ProblemService {
  private readonly problemServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.problemServiceUrl = this.configService.get<string>(
      'PROBLEM_SERVICE_URL',
      'http://localhost:8001',
    );
  }

  async getProblemDetails(problemId: string): Promise<ProblemDetails | null> {
    try {
      const response = await axios.get(
        `${this.problemServiceUrl}/api/v1/problems/${problemId}`,
        {
          timeout: 5000,
        },
      );

      const problem = response.data;
      return {
        id: problem.id,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
      };
    } catch (error) {
      console.error(`Failed to fetch problem ${problemId}:`, error.message);
      return null;
    }
  }

  async getMultipleProblems(
    problemIds: string[],
  ): Promise<Map<string, ProblemDetails>> {
    const results = new Map<string, ProblemDetails>();

    // Fetch all problems in parallel
    const promises = problemIds.map(async (id) => {
      const details = await this.getProblemDetails(id);
      if (details) {
        results.set(id, details);
      }
    });

    await Promise.all(promises);
    return results;
  }
}
