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
  logging: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    const tagRepo = AppDataSource.getRepository(Tag);
    const problemRepo = AppDataSource.getRepository(Problem);
    const testCaseRepo = AppDataSource.getRepository(TestCase);
    const starterCodeRepo = AppDataSource.getRepository(StarterCode);

    // Get existing tags
    console.log('Fetching existing tags...');
    const tags = await tagRepo.find();
    const arrayTag = tags.find(t => t.slug === 'array')!;
    const stringTag = tags.find(t => t.slug === 'string')!;
    const hashTableTag = tags.find(t => t.slug === 'hash-table')!;
    const dpTag = tags.find(t => t.slug === 'dynamic-programming')!;
    const stackTag = tags.find(t => t.slug === 'stack')!;

    let count = 0;

    // From Batch 2 - Problem 2: Longest Consecutive Sequence
    console.log('Creating Problem 7: Longest Consecutive Sequence...');
    const longestConsecutive = await problemRepo.save({
      slug: 'longest-consecutive-sequence',
      title: 'Longest Consecutive Sequence',
      description: `Given an unsorted array of integers \`nums\`, return *the length of the longest consecutive elements sequence.*

You must write an algorithm that runs in \`O(n)\` time.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a HashSet for O(1) lookups.',
        'For each number, check if it\\'s the start of a sequence (i.e., num-1 is not in the set).',
        'From each sequence start, count consecutive numbers.',
        'Don\\'t start counting from the middle of a sequence to avoid redundant work.',
      ],
      examples: [
        {
          input: 'nums = [100,4,200,1,3,2]',
          output: '4',
          explanation: 'The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.',
        },
        {
          input: 'nums = [0,3,7,2,5,8,4,6,0,1]',
          output: '9',
        },
      ],
      constraints: [
        '0 <= nums.length <= 10^5',
        '-10^9 <= nums[i] <= 10^9',
      ],
      companies: ['Google', 'Amazon', 'Facebook'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      tags: [arrayTag, hashTableTag],
    });
    count++;

    await testCaseRepo.save([
      { problemId: longestConsecutive.id, input: '[100,4,200,1,3,2]', expectedOutput: '4', isExample: true, isHidden: false, order: 1 },
      { problemId: longestConsecutive.id, input: '[0,3,7,2,5,8,4,6,0,1]', expectedOutput: '9', isExample: true, isHidden: false, order: 2 },
      { problemId: longestConsecutive.id, input: '[]', expectedOutput: '0', isExample: false, isHidden: true, order: 3 },
      { problemId: longestConsecutive.id, input: '[1]', expectedOutput: '1', isExample: false, isHidden: true, order: 4 },
      { problemId: longestConsecutive.id, input: '[9,1,4,7,3,-1,0,5,8,-2,6]', expectedOutput: '7', isExample: false, isHidden: true, order: 5 },
    ]);

    await starterCodeRepo.save([
      { problemId: longestConsecutive.id, language: ProgrammingLanguage.PYTHON, code: `def longestConsecutive(nums: List[int]) -> int:\n    # Write your code here\n    pass` },
      { problemId: longestConsecutive.id, language: ProgrammingLanguage.JAVASCRIPT, code: `/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction longestConsecutive(nums) {\n    // Write your code here\n}` },
      { problemId: longestConsecutive.id, language: ProgrammingLanguage.TYPESCRIPT, code: `function longestConsecutive(nums: number[]): number {\n    // Write your code here\n}` },
      { problemId: longestConsecutive.id, language: ProgrammingLanguage.JAVA, code: `class Solution {\n    public int longestConsecutive(int[] nums) {\n        // Write your code here\n    }\n}` },
      { problemId: longestConsecutive.id, language: ProgrammingLanguage.CPP, code: `class Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        // Write your code here\n    }\n};` },
      { problemId: longestConsecutive.id, language: ProgrammingLanguage.C, code: `int longestConsecutive(int* nums, int numsSize) {\n    // Write your code here\n}` },
      { problemId: longestConsecutive.id, language: ProgrammingLanguage.GO, code: `func longestConsecutive(nums []int) int {\n    // Write your code here\n}` },
    ]);

    console.log(`✅ ${count}/9 problems completed`);
    console.log('📊 Total: 15/15 hard problems (100% complete)');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
