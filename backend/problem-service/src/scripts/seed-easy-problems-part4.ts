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
    const mathTag = tags.find(t => t.slug === 'math')!;
    const twoPointersTag = tags.find(t => t.slug === 'two-pointers')!;

    // Problem 11: Merge Sorted Array
    console.log('Creating Problem 11: Merge Sorted Array...');
    const mergeSortedArray = await problemRepo.save({
      slug: 'merge-sorted-array',
      title: 'Merge Sorted Array',
      description: `You are given two integer arrays \`nums1\` and \`nums2\`, sorted in **non-decreasing order**, and two integers \`m\` and \`n\`, representing the number of elements in \`nums1\` and \`nums2\` respectively.

**Merge** \`nums1\` and \`nums2\` into a single array sorted in **non-decreasing order**.

The final sorted array should not be returned by the function, but instead be stored inside the array \`nums1\`. To accommodate this, \`nums1\` has a length of \`m + n\`, where the first \`m\` elements denote the elements that should be merged, and the last \`n\` elements are set to \`0\` and should be ignored. \`nums2\` has a length of \`n\`.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Start from the end of both arrays and compare elements.',
        'Use three pointers: one for nums1, one for nums2, and one for the merge position.',
        'Work backwards to avoid overwriting elements in nums1.',
      ],
      examples: [
        {
          input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3',
          output: '[1,2,2,3,5,6]',
          explanation: 'The arrays we are merging are [1,2,3] and [2,5,6]. The result of the merge is [1,2,2,3,5,6].',
        },
        {
          input: 'nums1 = [1], m = 1, nums2 = [], n = 0',
          output: '[1]',
          explanation: 'The arrays we are merging are [1] and []. The result of the merge is [1].',
        },
        {
          input: 'nums1 = [0], m = 0, nums2 = [1], n = 1',
          output: '[1]',
          explanation: 'The arrays we are merging are [] and [1]. The result of the merge is [1].',
        },
      ],
      constraints: [
        'nums1.length == m + n',
        'nums2.length == n',
        '0 <= m, n <= 200',
        '1 <= m + n <= 200',
        '-10^9 <= nums1[i], nums2[j] <= 10^9',
      ],
      companies: ['Facebook', 'Microsoft', 'Bloomberg'],
      timeComplexity: 'O(m + n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, twoPointersTag],
    });

    await testCaseRepo.save([
      {
        problemId: mergeSortedArray.id,
        input: '{"nums1": [1,2,3,0,0,0], "m": 3, "nums2": [2,5,6], "n": 3}',
        expectedOutput: '[1,2,2,3,5,6]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: mergeSortedArray.id,
        input: '{"nums1": [1], "m": 1, "nums2": [], "n": 0}',
        expectedOutput: '[1]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: mergeSortedArray.id,
        input: '{"nums1": [0], "m": 0, "nums2": [1], "n": 1}',
        expectedOutput: '[1]',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: mergeSortedArray.id,
        input: '{"nums1": [2,0], "m": 1, "nums2": [1], "n": 1}',
        expectedOutput: '[1,2]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: mergeSortedArray.id,
        input: '{"nums1": [4,5,6,0,0,0], "m": 3, "nums2": [1,2,3], "n": 3}',
        expectedOutput: '[1,2,3,4,5,6]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: mergeSortedArray.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'merge',
        code: `def merge(nums1, m, nums2, n):
    """
    :type nums1: List[int]
    :type m: int
    :type nums2: List[int]
    :type n: int
    :rtype: List[int]
    """
    pass`,
      },
      {
        problemId: mergeSortedArray.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'merge',
        code: `/**
 * @param {number[]} nums1
 * @param {number} m
 * @param {number[]} nums2
 * @param {number} n
 * @return {number[]}
 */
function merge(nums1, m, nums2, n) {

}`,
      },
      {
        problemId: mergeSortedArray.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'merge',
        code: `function merge(nums1: number[], m: number, nums2: number[], n: number): number[] {

}`,
      },
      {
        problemId: mergeSortedArray.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'merge',
        code: `class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {

    }
}`,
      },
      {
        problemId: mergeSortedArray.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'merge',
        code: `class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {

    }
};`,
      },
      {
        problemId: mergeSortedArray.id,
        language: ProgrammingLanguage.C,
        functionName: 'merge',
        code: `void merge(int* nums1, int nums1Size, int m, int* nums2, int nums2Size, int n) {

}`,
      },
      {
        problemId: mergeSortedArray.id,
        language: ProgrammingLanguage.GO,
        functionName: 'merge',
        code: `func merge(nums1 []int, m int, nums2 []int, n int) []int {

}`,
      },
    ]);

    // Problem 12: Remove Duplicates from Sorted Array
    console.log('Creating Problem 12: Remove Duplicates from Sorted Array...');
    const removeDuplicates = await problemRepo.save({
      slug: 'remove-duplicates-from-sorted-array',
      title: 'Remove Duplicates from Sorted Array',
      description: `Given an integer array \`nums\` sorted in **non-decreasing order**, remove the duplicates **in-place** such that each unique element appears only **once**. The **relative order** of the elements should be kept the **same**. Then return the number of unique elements in \`nums\`.

Consider the number of unique elements of \`nums\` to be \`k\`, to get accepted, you need to do the following things:

- Change the array \`nums\` such that the first \`k\` elements of \`nums\` contain the unique elements in the order they were present in \`nums\` initially.
- The remaining elements of \`nums\` are not important as well as the size of \`nums\`.
- Return \`k\`.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use two pointers - one for reading and one for writing.',
        'Only increment the write pointer when you find a new unique element.',
        'The array is already sorted, so duplicates are adjacent.',
      ],
      examples: [
        {
          input: 'nums = [1,1,2]',
          output: '2',
          explanation: 'Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively.',
        },
        {
          input: 'nums = [0,0,1,1,1,2,2,3,3,4]',
          output: '5',
          explanation: 'Your function should return k = 5, with the first five elements of nums being 0, 1, 2, 3, and 4 respectively.',
        },
      ],
      constraints: [
        '1 <= nums.length <= 3 * 10^4',
        '-100 <= nums[i] <= 100',
        'nums is sorted in non-decreasing order.',
      ],
      companies: ['Facebook', 'Microsoft', 'Google'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, twoPointersTag],
    });

    await testCaseRepo.save([
      {
        problemId: removeDuplicates.id,
        input: '[1,1,2]',
        expectedOutput: '2',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: removeDuplicates.id,
        input: '[0,0,1,1,1,2,2,3,3,4]',
        expectedOutput: '5',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: removeDuplicates.id,
        input: '[1]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: removeDuplicates.id,
        input: '[1,2,3,4,5]',
        expectedOutput: '5',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: removeDuplicates.id,
        input: '[1,1,1,1,1]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: removeDuplicates.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'removeDuplicates',
        code: `def removeDuplicates(nums):
    """
    :type nums: List[int]
    :rtype: int
    """
    pass`,
      },
      {
        problemId: removeDuplicates.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'removeDuplicates',
        code: `/**
 * @param {number[]} nums
 * @return {number}
 */
function removeDuplicates(nums) {

}`,
      },
      {
        problemId: removeDuplicates.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'removeDuplicates',
        code: `function removeDuplicates(nums: number[]): number {

}`,
      },
      {
        problemId: removeDuplicates.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'removeDuplicates',
        code: `class Solution {
    public int removeDuplicates(int[] nums) {

    }
}`,
      },
      {
        problemId: removeDuplicates.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'removeDuplicates',
        code: `class Solution {
public:
    int removeDuplicates(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: removeDuplicates.id,
        language: ProgrammingLanguage.C,
        functionName: 'removeDuplicates',
        code: `int removeDuplicates(int* nums, int numsSize) {

}`,
      },
      {
        problemId: removeDuplicates.id,
        language: ProgrammingLanguage.GO,
        functionName: 'removeDuplicates',
        code: `func removeDuplicates(nums []int) int {

}`,
      },
    ]);

    // Problem 13: Search Insert Position
    console.log('Creating Problem 13: Search Insert Position...');
    const searchInsert = await problemRepo.save({
      slug: 'search-insert-position',
      title: 'Search Insert Position',
      description: `Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use binary search for O(log n) time complexity.',
        'If the target is not found, the left pointer will be at the insertion position.',
        'Handle edge cases: target smaller than all elements, larger than all elements.',
      ],
      examples: [
        {
          input: 'nums = [1,3,5,6], target = 5',
          output: '2',
        },
        {
          input: 'nums = [1,3,5,6], target = 2',
          output: '1',
        },
        {
          input: 'nums = [1,3,5,6], target = 7',
          output: '4',
        },
      ],
      constraints: [
        '1 <= nums.length <= 10^4',
        '-10^4 <= nums[i] <= 10^4',
        'nums contains distinct values sorted in ascending order.',
        '-10^4 <= target <= 10^4',
      ],
      companies: ['Google', 'Amazon', 'Facebook'],
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: searchInsert.id,
        input: '{"nums": [1,3,5,6], "target": 5}',
        expectedOutput: '2',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: searchInsert.id,
        input: '{"nums": [1,3,5,6], "target": 2}',
        expectedOutput: '1',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: searchInsert.id,
        input: '{"nums": [1,3,5,6], "target": 7}',
        expectedOutput: '4',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: searchInsert.id,
        input: '{"nums": [1,3,5,6], "target": 0}',
        expectedOutput: '0',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: searchInsert.id,
        input: '{"nums": [1], "target": 1}',
        expectedOutput: '0',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: searchInsert.id,
        input: '{"nums": [1,3], "target": 2}',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 6,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: searchInsert.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'searchInsert',
        code: `def searchInsert(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: int
    """
    pass`,
      },
      {
        problemId: searchInsert.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'searchInsert',
        code: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function searchInsert(nums, target) {

}`,
      },
      {
        problemId: searchInsert.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'searchInsert',
        code: `function searchInsert(nums: number[], target: number): number {

}`,
      },
      {
        problemId: searchInsert.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'searchInsert',
        code: `class Solution {
    public int searchInsert(int[] nums, int target) {

    }
}`,
      },
      {
        problemId: searchInsert.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'searchInsert',
        code: `class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {

    }
};`,
      },
      {
        problemId: searchInsert.id,
        language: ProgrammingLanguage.C,
        functionName: 'searchInsert',
        code: `int searchInsert(int* nums, int numsSize, int target) {

}`,
      },
      {
        problemId: searchInsert.id,
        language: ProgrammingLanguage.GO,
        functionName: 'searchInsert',
        code: `func searchInsert(nums []int, target int) int {

}`,
      },
    ]);

    // Problem 14: Climbing Stairs
    console.log('Creating Problem 14: Climbing Stairs...');
    const climbingStairs = await problemRepo.save({
      slug: 'climbing-stairs',
      title: 'Climbing Stairs',
      description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'This is a Fibonacci sequence problem.',
        'To reach step n, you can come from step n-1 or n-2.',
        'Use dynamic programming: dp[i] = dp[i-1] + dp[i-2].',
        'Can be optimized to O(1) space by only storing the last two values.',
      ],
      examples: [
        {
          input: 'n = 2',
          output: '2',
          explanation: 'There are two ways to climb to the top: 1. 1 step + 1 step, 2. 2 steps',
        },
        {
          input: 'n = 3',
          output: '3',
          explanation: 'There are three ways to climb to the top: 1. 1 step + 1 step + 1 step, 2. 1 step + 2 steps, 3. 2 steps + 1 step',
        },
      ],
      constraints: [
        '1 <= n <= 45',
      ],
      companies: ['Amazon', 'Google', 'Adobe'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [mathTag],
    });

    await testCaseRepo.save([
      {
        problemId: climbingStairs.id,
        input: '2',
        expectedOutput: '2',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: climbingStairs.id,
        input: '3',
        expectedOutput: '3',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: climbingStairs.id,
        input: '1',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: climbingStairs.id,
        input: '5',
        expectedOutput: '8',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: climbingStairs.id,
        input: '10',
        expectedOutput: '89',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: climbingStairs.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'climbStairs',
        code: `def climbStairs(n):
    """
    :type n: int
    :rtype: int
    """
    pass`,
      },
      {
        problemId: climbingStairs.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'climbStairs',
        code: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {

}`,
      },
      {
        problemId: climbingStairs.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'climbStairs',
        code: `function climbStairs(n: number): number {

}`,
      },
      {
        problemId: climbingStairs.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'climbStairs',
        code: `class Solution {
    public int climbStairs(int n) {

    }
}`,
      },
      {
        problemId: climbingStairs.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'climbStairs',
        code: `class Solution {
public:
    int climbStairs(int n) {

    }
};`,
      },
      {
        problemId: climbingStairs.id,
        language: ProgrammingLanguage.C,
        functionName: 'climbStairs',
        code: `int climbStairs(int n) {

}`,
      },
      {
        problemId: climbingStairs.id,
        language: ProgrammingLanguage.GO,
        functionName: 'climbStairs',
        code: `func climbStairs(n int) int {

}`,
      },
    ]);

    // Problem 15: Pascal's Triangle
    console.log('Creating Problem 15: Pascal\'s Triangle...');
    const pascalTriangle = await problemRepo.save({
      slug: 'pascals-triangle',
      title: 'Pascal\'s Triangle',
      description: `Given an integer \`numRows\`, return the first numRows of **Pascal's triangle**.

In **Pascal's triangle**, each number is the sum of the two numbers directly above it as shown:

\`\`\`
    1
   1 1
  1 2 1
 1 3 3 1
1 4 6 4 1
\`\`\``,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Each row starts and ends with 1.',
        'For middle elements: triangle[i][j] = triangle[i-1][j-1] + triangle[i-1][j].',
        'Build the triangle row by row.',
      ],
      examples: [
        {
          input: 'numRows = 5',
          output: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]',
        },
        {
          input: 'numRows = 1',
          output: '[[1]]',
        },
      ],
      constraints: [
        '1 <= numRows <= 30',
      ],
      companies: ['Amazon', 'Apple', 'Bloomberg'],
      timeComplexity: 'O(numRows^2)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, mathTag],
    });

    await testCaseRepo.save([
      {
        problemId: pascalTriangle.id,
        input: '5',
        expectedOutput: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: pascalTriangle.id,
        input: '1',
        expectedOutput: '[[1]]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: pascalTriangle.id,
        input: '2',
        expectedOutput: '[[1],[1,1]]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: pascalTriangle.id,
        input: '3',
        expectedOutput: '[[1],[1,1],[1,2,1]]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: pascalTriangle.id,
        input: '6',
        expectedOutput: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1]]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: pascalTriangle.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'generate',
        code: `def generate(numRows):
    """
    :type numRows: int
    :rtype: List[List[int]]
    """
    pass`,
      },
      {
        problemId: pascalTriangle.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'generate',
        code: `/**
 * @param {number} numRows
 * @return {number[][]}
 */
function generate(numRows) {

}`,
      },
      {
        problemId: pascalTriangle.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'generate',
        code: `function generate(numRows: number): number[][] {

}`,
      },
      {
        problemId: pascalTriangle.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'generate',
        code: `class Solution {
    public List<List<Integer>> generate(int numRows) {

    }
}`,
      },
      {
        problemId: pascalTriangle.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'generate',
        code: `class Solution {
public:
    vector<vector<int>> generate(int numRows) {

    }
};`,
      },
      {
        problemId: pascalTriangle.id,
        language: ProgrammingLanguage.C,
        functionName: 'generate',
        code: `int** generate(int numRows, int* returnSize, int** returnColumnSizes) {

}`,
      },
      {
        problemId: pascalTriangle.id,
        language: ProgrammingLanguage.GO,
        functionName: 'generate',
        code: `func generate(numRows int) [][]int {

}`,
      },
    ]);

    console.log('✅ Part 4 seed completed successfully!');
    console.log('Created final 5 easy problems: Merge Sorted Array, Remove Duplicates, Search Insert Position, Climbing Stairs, Pascal\'s Triangle');
    console.log('\n🎉 All 15 easy problems have been created!');
    console.log('\nTotal added in this run:');
    console.log('- 5 problems (all Easy difficulty)');
    console.log('- 26 test cases (mix of example and hidden)');
    console.log('- 35 starter code templates (7 languages × 5 problems)');
    console.log('\nTotal easy problems: 18/60 (30% of MVP goal)');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
