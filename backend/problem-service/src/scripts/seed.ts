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

    // Create Tags
    console.log('Creating tags...');
    const tags = await tagRepo.save([
      { slug: 'array', name: 'Array', category: 'data-structure', description: 'Array manipulation problems' },
      { slug: 'string', name: 'String', category: 'data-structure', description: 'String manipulation problems' },
      { slug: 'math', name: 'Math', category: 'topic', description: 'Mathematical problems' },
      { slug: 'hash-table', name: 'Hash Table', category: 'data-structure', description: 'Hash table problems' },
      { slug: 'two-pointers', name: 'Two Pointers', category: 'algorithm', description: 'Two pointer technique' },
      { slug: 'sorting', name: 'Sorting', category: 'algorithm', description: 'Sorting algorithm problems' },
    ]);

    console.log('Tags created:', tags.length);

    // Problem 1: Two Sum (Easy)
    console.log('Creating Problem 1: Two Sum...');
    const twoSum = await problemRepo.save({
      slug: 'two-sum',
      title: 'Two Sum',
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Think about using a hash map to store the numbers you\'ve seen.',
        'For each number, check if target - number exists in your hash map.',
      ],
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
        },
        {
          input: 'nums = [3,2,4], target = 6',
          output: '[1,2]',
        },
      ],
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists.',
      ],
      companies: ['Google', 'Amazon', 'Microsoft', 'Facebook'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [tags.find(t => t.slug === 'array')!, tags.find(t => t.slug === 'hash-table')!],
    });

    await testCaseRepo.save([
      {
        problemId: twoSum.id,
        input: '[2,7,11,15]\n9',
        expectedOutput: '[0,1]',
        isExample: true,
        isHidden: false,
        order: 1,
        weight: 1.0,
      },
      {
        problemId: twoSum.id,
        input: '[3,2,4]\n6',
        expectedOutput: '[1,2]',
        isExample: true,
        isHidden: false,
        order: 2,
        weight: 1.0,
      },
      {
        problemId: twoSum.id,
        input: '[3,3]\n6',
        expectedOutput: '[0,1]',
        isExample: false,
        isHidden: true,
        order: 3,
        weight: 1.0,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: twoSum.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'twoSum',
        code: `def twoSum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    pass`,
      },
      {
        problemId: twoSum.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'twoSum',
        code: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {

}`,
      },
    ]);

    // Problem 2: Palindrome Number (Easy)
    console.log('Creating Problem 2: Palindrome Number...');
    const palindrome = await problemRepo.save({
      slug: 'palindrome-number',
      title: 'Palindrome Number',
      description: `Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise.

An integer is a **palindrome** when it reads the same forward and backward.

For example, \`121\` is a palindrome while \`123\` is not.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Negative numbers are not palindromes.',
        'You could convert the number to a string and check if it reads the same forwards and backwards.',
        'Can you solve it without converting to a string?',
      ],
      examples: [
        {
          input: 'x = 121',
          output: 'true',
          explanation: '121 reads as 121 from left to right and from right to left.',
        },
        {
          input: 'x = -121',
          output: 'false',
          explanation: 'From left to right, it reads -121. From right to left, it becomes 121-.',
        },
        {
          input: 'x = 10',
          output: 'false',
          explanation: 'Reads 01 from right to left.',
        },
      ],
      constraints: ['-2^31 <= x <= 2^31 - 1'],
      companies: ['Amazon', 'Apple', 'Bloomberg'],
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [tags.find(t => t.slug === 'math')!],
    });

    await testCaseRepo.save([
      {
        problemId: palindrome.id,
        input: '121',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 1,
        weight: 1.0,
      },
      {
        problemId: palindrome.id,
        input: '-121',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 2,
        weight: 1.0,
      },
      {
        problemId: palindrome.id,
        input: '10',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 3,
        weight: 1.0,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: palindrome.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'isPalindrome',
        code: `def isPalindrome(x):
    """
    :type x: int
    :rtype: bool
    """
    pass`,
      },
      {
        problemId: palindrome.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'isPalindrome',
        code: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {

}`,
      },
    ]);

    // Problem 3: Valid Anagram (Easy)
    console.log('Creating Problem 3: Valid Anagram...');
    const anagram = await problemRepo.save({
      slug: 'valid-anagram',
      title: 'Valid Anagram',
      description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Count the frequency of each character in both strings.',
        'If the frequency of characters is the same, they are anagrams.',
      ],
      examples: [
        {
          input: 's = "anagram", t = "nagaram"',
          output: 'true',
        },
        {
          input: 's = "rat", t = "car"',
          output: 'false',
        },
      ],
      constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
      companies: ['Facebook', 'Google', 'Amazon'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [tags.find(t => t.slug === 'string')!, tags.find(t => t.slug === 'hash-table')!, tags.find(t => t.slug === 'sorting')!],
    });

    await testCaseRepo.save([
      {
        problemId: anagram.id,
        input: 'anagram\nnagaram',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 1,
        weight: 1.0,
      },
      {
        problemId: anagram.id,
        input: 'rat\ncar',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 2,
        weight: 1.0,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: anagram.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'isAnagram',
        code: `def isAnagram(s, t):
    """
    :type s: str
    :type t: str
    :rtype: bool
    """
    pass`,
      },
      {
        problemId: anagram.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'isAnagram',
        code: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isAnagram(s, t) {

}`,
      },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log('Created:');
    console.log('- 6 tags');
    console.log('- 3 problems');
    console.log('- 8 test cases');
    console.log('- 6 starter code templates');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
