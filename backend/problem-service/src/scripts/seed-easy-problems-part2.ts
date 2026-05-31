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
    const mathTag = tags.find(t => t.slug === 'math')!;
    const hashTableTag = tags.find(t => t.slug === 'hash-table')!;
    const twoPointersTag = tags.find(t => t.slug === 'two-pointers')!;
    const sortingTag = tags.find(t => t.slug === 'sorting')!;

    // Problem 5: Contains Duplicate
    console.log('Creating Problem 5: Contains Duplicate...');
    const containsDuplicate = await problemRepo.save({
      slug: 'contains-duplicate',
      title: 'Contains Duplicate',
      description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a hash set to keep track of numbers you\'ve seen.',
        'If you encounter a number that\'s already in the set, return true.',
      ],
      examples: [
        {
          input: 'nums = [1,2,3,1]',
          output: 'true',
        },
        {
          input: 'nums = [1,2,3,4]',
          output: 'false',
        },
        {
          input: 'nums = [1,1,1,3,3,4,3,2,4,2]',
          output: 'true',
        },
      ],
      constraints: [
        '1 <= nums.length <= 10^5',
        '-10^9 <= nums[i] <= 10^9',
      ],
      companies: ['Google', 'Apple', 'Amazon'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, hashTableTag, sortingTag],
    });

    await testCaseRepo.save([
      {
        problemId: containsDuplicate.id,
        input: '[1,2,3,1]',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: containsDuplicate.id,
        input: '[1,2,3,4]',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: containsDuplicate.id,
        input: '[1,1,1,3,3,4,3,2,4,2]',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: containsDuplicate.id,
        input: '[1]',
        expectedOutput: 'false',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: containsDuplicate.id,
        input: '[1,2]',
        expectedOutput: 'false',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'containsDuplicate',
        code: `def containsDuplicate(nums):
    """
    :type nums: List[int]
    :rtype: bool
    """
    pass`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'containsDuplicate',
        code: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function containsDuplicate(nums) {

}`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'containsDuplicate',
        code: `function containsDuplicate(nums: number[]): boolean {

}`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'containsDuplicate',
        code: `class Solution {
    public boolean containsDuplicate(int[] nums) {

    }
}`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'containsDuplicate',
        code: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.C,
        functionName: 'containsDuplicate',
        code: `bool containsDuplicate(int* nums, int numsSize) {

}`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.GO,
        functionName: 'containsDuplicate',
        code: `func containsDuplicate(nums []int) bool {

}`,
      },
    ]);

    // Problem 6: Missing Number
    console.log('Creating Problem 6: Missing Number...');
    const missingNumber = await problemRepo.save({
      slug: 'missing-number',
      title: 'Missing Number',
      description: `Given an array \`nums\` containing \`n\` distinct numbers in the range \`[0, n]\`, return the only number in the range that is missing from the array.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'The sum of numbers from 0 to n is n*(n+1)/2.',
        'Subtract the sum of the array from the expected sum to find the missing number.',
        'Alternatively, use XOR properties: a XOR a = 0 and a XOR 0 = a.',
      ],
      examples: [
        {
          input: 'nums = [3,0,1]',
          output: '2',
          explanation: 'n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is the missing number.',
        },
        {
          input: 'nums = [0,1]',
          output: '2',
        },
        {
          input: 'nums = [9,6,4,2,3,5,7,0,1]',
          output: '8',
        },
      ],
      constraints: [
        'n == nums.length',
        '1 <= n <= 10^4',
        '0 <= nums[i] <= n',
        'All the numbers of nums are unique.',
      ],
      companies: ['Amazon', 'Microsoft', 'Bloomberg'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, mathTag],
    });

    await testCaseRepo.save([
      {
        problemId: missingNumber.id,
        input: '[3,0,1]',
        expectedOutput: '2',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: missingNumber.id,
        input: '[0,1]',
        expectedOutput: '2',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: missingNumber.id,
        input: '[9,6,4,2,3,5,7,0,1]',
        expectedOutput: '8',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: missingNumber.id,
        input: '[0]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: missingNumber.id,
        input: '[1]',
        expectedOutput: '0',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: missingNumber.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'missingNumber',
        code: `def missingNumber(nums):
    """
    :type nums: List[int]
    :rtype: int
    """
    pass`,
      },
      {
        problemId: missingNumber.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'missingNumber',
        code: `/**
 * @param {number[]} nums
 * @return {number}
 */
function missingNumber(nums) {

}`,
      },
      {
        problemId: missingNumber.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'missingNumber',
        code: `function missingNumber(nums: number[]): number {

}`,
      },
      {
        problemId: missingNumber.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'missingNumber',
        code: `class Solution {
    public int missingNumber(int[] nums) {

    }
}`,
      },
      {
        problemId: missingNumber.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'missingNumber',
        code: `class Solution {
public:
    int missingNumber(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: missingNumber.id,
        language: ProgrammingLanguage.C,
        functionName: 'missingNumber',
        code: `int missingNumber(int* nums, int numsSize) {

}`,
      },
      {
        problemId: missingNumber.id,
        language: ProgrammingLanguage.GO,
        functionName: 'missingNumber',
        code: `func missingNumber(nums []int) int {

}`,
      },
    ]);

    // Problem 7: Single Number
    console.log('Creating Problem 7: Single Number...');
    const singleNumber = await problemRepo.save({
      slug: 'single-number',
      title: 'Single Number',
      description: `Given a **non-empty** array of integers \`nums\`, every element appears twice except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use XOR operation. XOR of two same numbers is 0.',
        'XOR of a number with 0 is the number itself.',
        'XOR all numbers together - duplicates will cancel out, leaving only the single number.',
      ],
      examples: [
        {
          input: 'nums = [2,2,1]',
          output: '1',
        },
        {
          input: 'nums = [4,1,2,1,2]',
          output: '4',
        },
        {
          input: 'nums = [1]',
          output: '1',
        },
      ],
      constraints: [
        '1 <= nums.length <= 3 * 10^4',
        '-3 * 10^4 <= nums[i] <= 3 * 10^4',
        'Each element in the array appears twice except for one element which appears only once.',
      ],
      companies: ['Google', 'Amazon', 'Apple'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: singleNumber.id,
        input: '[2,2,1]',
        expectedOutput: '1',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: singleNumber.id,
        input: '[4,1,2,1,2]',
        expectedOutput: '4',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: singleNumber.id,
        input: '[1]',
        expectedOutput: '1',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: singleNumber.id,
        input: '[7,3,5,3,5]',
        expectedOutput: '7',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: singleNumber.id,
        input: '[10,20,10]',
        expectedOutput: '20',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: singleNumber.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'singleNumber',
        code: `def singleNumber(nums):
    """
    :type nums: List[int]
    :rtype: int
    """
    pass`,
      },
      {
        problemId: singleNumber.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'singleNumber',
        code: `/**
 * @param {number[]} nums
 * @return {number}
 */
function singleNumber(nums) {

}`,
      },
      {
        problemId: singleNumber.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'singleNumber',
        code: `function singleNumber(nums: number[]): number {

}`,
      },
      {
        problemId: singleNumber.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'singleNumber',
        code: `class Solution {
    public int singleNumber(int[] nums) {

    }
}`,
      },
      {
        problemId: singleNumber.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'singleNumber',
        code: `class Solution {
public:
    int singleNumber(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: singleNumber.id,
        language: ProgrammingLanguage.C,
        functionName: 'singleNumber',
        code: `int singleNumber(int* nums, int numsSize) {

}`,
      },
      {
        problemId: singleNumber.id,
        language: ProgrammingLanguage.GO,
        functionName: 'singleNumber',
        code: `func singleNumber(nums []int) int {

}`,
      },
    ]);

    console.log('✅ Part 2 seed completed successfully!');
    console.log('Created 3 more problems: Contains Duplicate, Missing Number, Single Number');
    console.log('\nNote: Remaining 3 problems will be added in part 3.');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
