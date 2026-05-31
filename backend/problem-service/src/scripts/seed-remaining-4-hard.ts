import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Problem, ProblemDifficulty, ProblemStatus } from '../entities/problem.entity';
import { TestCase } from '../entities/test-case.entity';
import { Tag } from '../entities/tag.entity';
import { StarterCode, ProgrammingLanguage } from '../entities/starter-code.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'codesphere_problems',
  entities: [Problem, TestCase, Tag, StarterCode],
  synchronize: false,
  logging: false,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    
    const tagRepo = AppDataSource.getRepository(Tag);
    const problemRepo = AppDataSource.getRepository(Problem);
    const testCaseRepo = AppDataSource.getRepository(TestCase);
    const starterCodeRepo = AppDataSource.getRepository(StarterCode);

    const tags = await tagRepo.find();
    const hashTableTag = tags.find(t => t.slug === 'hash-table')!;
    const arrayTag = tags.find(t => t.slug === 'array')!;
    const stringTag = tags.find(t => t.slug === 'string')!;

    console.log('Adding 4 remaining hard problems...');

    // 1. Word Ladder - skipping for now as it had issues

    // 2. Edit Distance
    const editDist = await problemRepo.save({
      slug: 'edit-distance',
      title: 'Edit Distance',
      description: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.',
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [],
      examples: [],
      constraints: [],
      companies: ['Google'],
      timeComplexity: 'O(m*n)',
      spaceComplexity: 'O(m*n)',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      tags: [stringTag],
    });
    console.log('✅ Added edit-distance');

    // 3. Maximal Rectangle  
    const maxRect = await problemRepo.save({
      slug: 'maximal-rectangle',
      title: 'Maximal Rectangle',
      description: 'Given a rows x cols binary matrix filled with 0s and 1s, find the largest rectangle containing only 1s and return its area.',
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [],
      examples: [],
      constraints: [],
      companies: ['Amazon'],
      timeComplexity: 'O(rows*cols)',
      spaceComplexity: 'O(cols)',
      timeLimitMs: 3000,
      memoryLimitMb: 256,
      tags: [arrayTag],
    });
    console.log('✅ Added maximal-rectangle');

    // 4. Longest Valid Parentheses
    const longValidParen = await problemRepo.save({
      slug: 'longest-valid-parentheses',
      title: 'Longest Valid Parentheses',
      description: 'Given a string containing just the characters ( and ), return the length of the longest valid (well-formed) parentheses substring.',
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [],
      examples: [],
      constraints: [],
      companies: ['Amazon'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      tags: [stringTag],
    });
    console.log('✅ Added longest-valid-parentheses');

    // 5. Word Ladder (re-adding)
    const wordLad = await problemRepo.save({
      slug: 'word-ladder',
      title: 'Word Ladder',
      description: 'Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord.',
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [],
      examples: [],
      constraints: [],
      companies: ['Amazon'],
      timeComplexity: 'O(M^2*N)',
      spaceComplexity: 'O(M^2*N)',
      timeLimitMs: 3000,
      memoryLimitMb: 256,
      tags: [hashTableTag, stringTag],
    });
    console.log('✅ Added word-ladder');

    console.log('\n🎉 ALL 15 HARD PROBLEMS COMPLETE!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seed();
