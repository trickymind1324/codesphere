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

    // Problem 8: Majority Element
    console.log('Creating Problem 8: Majority Element...');
    const majorityElement = await problemRepo.save({
      slug: 'majority-element',
      title: 'Majority Element',
      description: `Given an array \`nums\` of size \`n\`, return the majority element.

The majority element is the element that appears more than \`⌊n / 2⌋\` times. You may assume that the majority element always exists in the array.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use Boyer-Moore Voting Algorithm for O(1) space complexity.',
        'Count the occurrences of the candidate element.',
        'If count reaches 0, change the candidate to the current element.',
      ],
      examples: [
        {
          input: 'nums = [3,2,3]',
          output: '3',
        },
        {
          input: 'nums = [2,2,1,1,1,2,2]',
          output: '2',
        },
      ],
      constraints: [
        'n == nums.length',
        '1 <= n <= 5 * 10^4',
        '-10^9 <= nums[i] <= 10^9',
      ],
      companies: ['Adobe', 'Amazon', 'Microsoft'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, hashTableTag, sortingTag],
    });

    await testCaseRepo.save([
      {
        problemId: majorityElement.id,
        input: '[3,2,3]',
        expectedOutput: '3',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: majorityElement.id,
        input: '[2,2,1,1,1,2,2]',
        expectedOutput: '2',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: majorityElement.id,
        input: '[1]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: majorityElement.id,
        input: '[6,5,5]',
        expectedOutput: '5',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: majorityElement.id,
        input: '[1,2,3,4,5,6,7,8,9,1,1,1,1,1,1,1]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: majorityElement.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'majorityElement',
        code: `def majorityElement(nums):
    """
    :type nums: List[int]
    :rtype: int
    """
    pass`,
      },
      {
        problemId: majorityElement.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'majorityElement',
        code: `/**
 * @param {number[]} nums
 * @return {number}
 */
function majorityElement(nums) {

}`,
      },
      {
        problemId: majorityElement.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'majorityElement',
        code: `function majorityElement(nums: number[]): number {

}`,
      },
      {
        problemId: majorityElement.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'majorityElement',
        code: `class Solution {
    public int majorityElement(int[] nums) {

    }
}`,
      },
      {
        problemId: majorityElement.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'majorityElement',
        code: `class Solution {
public:
    int majorityElement(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: majorityElement.id,
        language: ProgrammingLanguage.C,
        functionName: 'majorityElement',
        code: `int majorityElement(int* nums, int numsSize) {

}`,
      },
      {
        problemId: majorityElement.id,
        language: ProgrammingLanguage.GO,
        functionName: 'majorityElement',
        code: `func majorityElement(nums []int) int {

}`,
      },
    ]);

    // Problem 9: Move Zeroes
    console.log('Creating Problem 9: Move Zeroes...');
    const moveZeroes = await problemRepo.save({
      slug: 'move-zeroes',
      title: 'Move Zeroes',
      description: `Given an integer array \`nums\`, move all \`0\`'s to the end of it while maintaining the relative order of the non-zero elements.

**Note** that you must do this in-place without making a copy of the array.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use two pointers - one for reading and one for writing non-zero elements.',
        'Iterate through the array and swap non-zero elements to the front.',
        'Fill remaining positions with zeros.',
      ],
      examples: [
        {
          input: 'nums = [0,1,0,3,12]',
          output: '[1,3,12,0,0]',
        },
        {
          input: 'nums = [0]',
          output: '[0]',
        },
      ],
      constraints: [
        '1 <= nums.length <= 10^4',
        '-2^31 <= nums[i] <= 2^31 - 1',
      ],
      companies: ['Facebook', 'Apple', 'Amazon'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, twoPointersTag],
    });

    await testCaseRepo.save([
      {
        problemId: moveZeroes.id,
        input: '[0,1,0,3,12]',
        expectedOutput: '[1,3,12,0,0]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: moveZeroes.id,
        input: '[0]',
        expectedOutput: '[0]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: moveZeroes.id,
        input: '[1,2,3]',
        expectedOutput: '[1,2,3]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: moveZeroes.id,
        input: '[0,0,1]',
        expectedOutput: '[1,0,0]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: moveZeroes.id,
        input: '[2,1]',
        expectedOutput: '[2,1]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: moveZeroes.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'moveZeroes',
        code: `def moveZeroes(nums):
    """
    :type nums: List[int]
    :rtype: List[int]
    """
    pass`,
      },
      {
        problemId: moveZeroes.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'moveZeroes',
        code: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function moveZeroes(nums) {

}`,
      },
      {
        problemId: moveZeroes.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'moveZeroes',
        code: `function moveZeroes(nums: number[]): number[] {

}`,
      },
      {
        problemId: moveZeroes.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'moveZeroes',
        code: `class Solution {
    public void moveZeroes(int[] nums) {

    }
}`,
      },
      {
        problemId: moveZeroes.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'moveZeroes',
        code: `class Solution {
public:
    void moveZeroes(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: moveZeroes.id,
        language: ProgrammingLanguage.C,
        functionName: 'moveZeroes',
        code: `void moveZeroes(int* nums, int numsSize) {

}`,
      },
      {
        problemId: moveZeroes.id,
        language: ProgrammingLanguage.GO,
        functionName: 'moveZeroes',
        code: `func moveZeroes(nums []int) []int {

}`,
      },
    ]);

    // Problem 10: Plus One
    console.log('Creating Problem 10: Plus One...');
    const plusOne = await problemRepo.save({
      slug: 'plus-one',
      title: 'Plus One',
      description: `You are given a **large integer** represented as an integer array \`digits\`, where each \`digits[i]\` is the \`ith\` digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading \`0\`'s.

Increment the large integer by one and return the resulting array of digits.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Start from the last digit and add 1.',
        'If there\'s a carry, propagate it to the left.',
        'If all digits are 9, you need to add a new digit at the beginning.',
      ],
      examples: [
        {
          input: 'digits = [1,2,3]',
          output: '[1,2,4]',
          explanation: 'The array represents the integer 123. Incrementing by one gives 123 + 1 = 124.',
        },
        {
          input: 'digits = [4,3,2,1]',
          output: '[4,3,2,2]',
          explanation: 'The array represents the integer 4321. Incrementing by one gives 4321 + 1 = 4322.',
        },
        {
          input: 'digits = [9]',
          output: '[1,0]',
          explanation: 'The array represents the integer 9. Incrementing by one gives 9 + 1 = 10.',
        },
      ],
      constraints: [
        '1 <= digits.length <= 100',
        '0 <= digits[i] <= 9',
        'digits does not contain any leading 0\'s.',
      ],
      companies: ['Google', 'Amazon', 'Apple'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, mathTag],
    });

    await testCaseRepo.save([
      {
        problemId: plusOne.id,
        input: '[1,2,3]',
        expectedOutput: '[1,2,4]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: plusOne.id,
        input: '[4,3,2,1]',
        expectedOutput: '[4,3,2,2]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: plusOne.id,
        input: '[9]',
        expectedOutput: '[1,0]',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: plusOne.id,
        input: '[9,9,9]',
        expectedOutput: '[1,0,0,0]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: plusOne.id,
        input: '[1,9,9]',
        expectedOutput: '[2,0,0]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: plusOne.id,
        input: '[0]',
        expectedOutput: '[1]',
        isExample: false,
        isHidden: true,
        order: 6,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: plusOne.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'plusOne',
        code: `def plusOne(digits):
    """
    :type digits: List[int]
    :rtype: List[int]
    """
    pass`,
      },
      {
        problemId: plusOne.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'plusOne',
        code: `/**
 * @param {number[]} digits
 * @return {number[]}
 */
function plusOne(digits) {

}`,
      },
      {
        problemId: plusOne.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'plusOne',
        code: `function plusOne(digits: number[]): number[] {

}`,
      },
      {
        problemId: plusOne.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'plusOne',
        code: `class Solution {
    public int[] plusOne(int[] digits) {

    }
}`,
      },
      {
        problemId: plusOne.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'plusOne',
        code: `class Solution {
public:
    vector<int> plusOne(vector<int>& digits) {

    }
};`,
      },
      {
        problemId: plusOne.id,
        language: ProgrammingLanguage.C,
        functionName: 'plusOne',
        code: `int* plusOne(int* digits, int digitsSize, int* returnSize) {

}`,
      },
      {
        problemId: plusOne.id,
        language: ProgrammingLanguage.GO,
        functionName: 'plusOne',
        code: `func plusOne(digits []int) []int {

}`,
      },
    ]);

    console.log('✅ Part 3 seed completed successfully!');
    console.log('Created final 3 problems: Majority Element, Move Zeroes, Plus One');
    console.log('\n🎉 All 10 easy problems have been created!');
    console.log('\nTotal added:');
    console.log('- 10 problems (all Easy difficulty)');
    console.log('- 52 test cases (mix of example and hidden)');
    console.log('- 70 starter code templates (7 languages × 10 problems)');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
