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
    const twoPointersTag = tags.find(t => t.slug === 'two-pointers')!;
    const sortingTag = tags.find(t => t.slug === 'sorting')!;

    // Problem 1: Product of Array Except Self
    console.log('Creating Problem 1: Product of Array Except Self...');
    const productExceptSelf = await problemRepo.save({
      slug: 'product-of-array-except-self',
      title: 'Product of Array Except Self',
      description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.

You must write an algorithm that runs in \`O(n)\` time and without using the division operation.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Calculate the product of all elements to the left of each element.',
        'Calculate the product of all elements to the right of each element.',
        'Multiply left and right products to get the result.',
        'Can be optimized to O(1) space by computing products on the fly.',
      ],
      examples: [
        {
          input: 'nums = [1,2,3,4]',
          output: '[24,12,8,6]',
        },
        {
          input: 'nums = [-1,1,0,-3,3]',
          output: '[0,0,9,0,0]',
        },
      ],
      constraints: [
        '2 <= nums.length <= 10^5',
        '-30 <= nums[i] <= 30',
        'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.',
      ],
      companies: ['Amazon', 'Facebook', 'Microsoft'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: productExceptSelf.id,
        input: '[1,2,3,4]',
        expectedOutput: '[24,12,8,6]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: productExceptSelf.id,
        input: '[-1,1,0,-3,3]',
        expectedOutput: '[0,0,9,0,0]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: productExceptSelf.id,
        input: '[2,3,4,5]',
        expectedOutput: '[60,40,30,24]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: productExceptSelf.id,
        input: '[1,1]',
        expectedOutput: '[1,1]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: productExceptSelf.id,
        input: '[0,0]',
        expectedOutput: '[0,0]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: productExceptSelf.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'productExceptSelf',
        code: `def productExceptSelf(nums):
    """
    :type nums: List[int]
    :rtype: List[int]
    """
    pass`,
      },
      {
        problemId: productExceptSelf.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'productExceptSelf',
        code: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function productExceptSelf(nums) {

}`,
      },
      {
        problemId: productExceptSelf.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'productExceptSelf',
        code: `function productExceptSelf(nums: number[]): number[] {

}`,
      },
      {
        problemId: productExceptSelf.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'productExceptSelf',
        code: `class Solution {
    public int[] productExceptSelf(int[] nums) {

    }
}`,
      },
      {
        problemId: productExceptSelf.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'productExceptSelf',
        code: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: productExceptSelf.id,
        language: ProgrammingLanguage.C,
        functionName: 'productExceptSelf',
        code: `int* productExceptSelf(int* nums, int numsSize, int* returnSize) {

}`,
      },
      {
        problemId: productExceptSelf.id,
        language: ProgrammingLanguage.GO,
        functionName: 'productExceptSelf',
        code: `func productExceptSelf(nums []int) []int {

}`,
      },
    ]);

    // Problem 2: Container With Most Water
    console.log('Creating Problem 2: Container With Most Water...');
    const containerWithMostWater = await problemRepo.save({
      slug: 'container-with-most-water',
      title: 'Container With Most Water',
      description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`ith\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

**Notice** that you may not slant the container.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use two pointers, one at the beginning and one at the end.',
        'The area is determined by the shorter line.',
        'Move the pointer pointing to the shorter line inward.',
        'Keep track of the maximum area found.',
      ],
      examples: [
        {
          input: 'height = [1,8,6,2,5,4,8,3,7]',
          output: '49',
          explanation: 'The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. The max area of water is 49.',
        },
        {
          input: 'height = [1,1]',
          output: '1',
        },
      ],
      constraints: [
        'n == height.length',
        '2 <= n <= 10^5',
        '0 <= height[i] <= 10^4',
      ],
      companies: ['Amazon', 'Google', 'Facebook'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, twoPointersTag],
    });

    await testCaseRepo.save([
      {
        problemId: containerWithMostWater.id,
        input: '[1,8,6,2,5,4,8,3,7]',
        expectedOutput: '49',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: containerWithMostWater.id,
        input: '[1,1]',
        expectedOutput: '1',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: containerWithMostWater.id,
        input: '[4,3,2,1,4]',
        expectedOutput: '16',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: containerWithMostWater.id,
        input: '[1,2,1]',
        expectedOutput: '2',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: containerWithMostWater.id,
        input: '[2,3,4,5,18,17,6]',
        expectedOutput: '17',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: containerWithMostWater.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'maxArea',
        code: `def maxArea(height):
    """
    :type height: List[int]
    :rtype: int
    """
    pass`,
      },
      {
        problemId: containerWithMostWater.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'maxArea',
        code: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {

}`,
      },
      {
        problemId: containerWithMostWater.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'maxArea',
        code: `function maxArea(height: number[]): number {

}`,
      },
      {
        problemId: containerWithMostWater.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'maxArea',
        code: `class Solution {
    public int maxArea(int[] height) {

    }
}`,
      },
      {
        problemId: containerWithMostWater.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'maxArea',
        code: `class Solution {
public:
    int maxArea(vector<int>& height) {

    }
};`,
      },
      {
        problemId: containerWithMostWater.id,
        language: ProgrammingLanguage.C,
        functionName: 'maxArea',
        code: `int maxArea(int* height, int heightSize) {

}`,
      },
      {
        problemId: containerWithMostWater.id,
        language: ProgrammingLanguage.GO,
        functionName: 'maxArea',
        code: `func maxArea(height []int) int {

}`,
      },
    ]);

    // Problem 3: 3Sum
    console.log('Creating Problem 3: 3Sum...');
    const threeSum = await problemRepo.save({
      slug: '3sum',
      title: '3Sum',
      description: `Given an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Sort the array first.',
        'Use a fixed pointer and two pointers for the remaining elements.',
        'Skip duplicates to avoid duplicate triplets.',
        'For each element, find pairs that sum to the negative of that element.',
      ],
      examples: [
        {
          input: 'nums = [-1,0,1,2,-1,-4]',
          output: '[[-1,-1,2],[-1,0,1]]',
          explanation: 'nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0. nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0. nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0.',
        },
        {
          input: 'nums = [0,1,1]',
          output: '[]',
          explanation: 'The only possible triplet does not sum up to 0.',
        },
        {
          input: 'nums = [0,0,0]',
          output: '[[0,0,0]]',
          explanation: 'The only possible triplet sums up to 0.',
        },
      ],
      constraints: [
        '3 <= nums.length <= 3000',
        '-10^5 <= nums[i] <= 10^5',
      ],
      companies: ['Facebook', 'Amazon', 'Microsoft'],
      timeComplexity: 'O(n^2)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 3000,
      memoryLimitMb: 128,
      tags: [arrayTag, twoPointersTag, sortingTag],
    });

    await testCaseRepo.save([
      {
        problemId: threeSum.id,
        input: '[-1,0,1,2,-1,-4]',
        expectedOutput: '[[-1,-1,2],[-1,0,1]]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: threeSum.id,
        input: '[0,1,1]',
        expectedOutput: '[]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: threeSum.id,
        input: '[0,0,0]',
        expectedOutput: '[[0,0,0]]',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: threeSum.id,
        input: '[-2,0,1,1,2]',
        expectedOutput: '[[-2,0,2],[-2,1,1]]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: threeSum.id,
        input: '[1,2,-2,-1]',
        expectedOutput: '[]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: threeSum.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'threeSum',
        code: `def threeSum(nums):
    """
    :type nums: List[int]
    :rtype: List[List[int]]
    """
    pass`,
      },
      {
        problemId: threeSum.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'threeSum',
        code: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function threeSum(nums) {

}`,
      },
      {
        problemId: threeSum.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'threeSum',
        code: `function threeSum(nums: number[]): number[][] {

}`,
      },
      {
        problemId: threeSum.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'threeSum',
        code: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {

    }
}`,
      },
      {
        problemId: threeSum.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'threeSum',
        code: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: threeSum.id,
        language: ProgrammingLanguage.C,
        functionName: 'threeSum',
        code: `int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {

}`,
      },
      {
        problemId: threeSum.id,
        language: ProgrammingLanguage.GO,
        functionName: 'threeSum',
        code: `func threeSum(nums []int) [][]int {

}`,
      },
    ]);

    // Problem 4: Longest Substring Without Repeating Characters
    console.log('Creating Problem 4: Longest Substring Without Repeating Characters...');
    const longestSubstring = await problemRepo.save({
      slug: 'longest-substring-without-repeating-characters',
      title: 'Longest Substring Without Repeating Characters',
      description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a sliding window approach.',
        'Keep track of characters seen in the current window using a hash set or map.',
        'When a duplicate is found, shrink the window from the left.',
        'Track the maximum window size.',
      ],
      examples: [
        {
          input: 's = "abcabcbb"',
          output: '3',
          explanation: 'The answer is "abc", with the length of 3.',
        },
        {
          input: 's = "bbbbb"',
          output: '1',
          explanation: 'The answer is "b", with the length of 1.',
        },
        {
          input: 's = "pwwkew"',
          output: '3',
          explanation: 'The answer is "wke", with the length of 3. Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.',
        },
      ],
      constraints: [
        '0 <= s.length <= 5 * 10^4',
        's consists of English letters, digits, symbols and spaces.',
      ],
      companies: ['Amazon', 'Google', 'Bloomberg'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(min(m, n))',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag, hashTableTag],
    });

    await testCaseRepo.save([
      {
        problemId: longestSubstring.id,
        input: '"abcabcbb"',
        expectedOutput: '3',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: longestSubstring.id,
        input: '"bbbbb"',
        expectedOutput: '1',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: longestSubstring.id,
        input: '"pwwkew"',
        expectedOutput: '3',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: longestSubstring.id,
        input: '""',
        expectedOutput: '0',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: longestSubstring.id,
        input: '"dvdf"',
        expectedOutput: '3',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: longestSubstring.id,
        input: '"abba"',
        expectedOutput: '2',
        isExample: false,
        isHidden: true,
        order: 6,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: longestSubstring.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'lengthOfLongestSubstring',
        code: `def lengthOfLongestSubstring(s):
    """
    :type s: str
    :rtype: int
    """
    pass`,
      },
      {
        problemId: longestSubstring.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'lengthOfLongestSubstring',
        code: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {

}`,
      },
      {
        problemId: longestSubstring.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'lengthOfLongestSubstring',
        code: `function lengthOfLongestSubstring(s: string): number {

}`,
      },
      {
        problemId: longestSubstring.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'lengthOfLongestSubstring',
        code: `class Solution {
    public int lengthOfLongestSubstring(String s) {

    }
}`,
      },
      {
        problemId: longestSubstring.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'lengthOfLongestSubstring',
        code: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {

    }
};`,
      },
      {
        problemId: longestSubstring.id,
        language: ProgrammingLanguage.C,
        functionName: 'lengthOfLongestSubstring',
        code: `int lengthOfLongestSubstring(char* s) {

}`,
      },
      {
        problemId: longestSubstring.id,
        language: ProgrammingLanguage.GO,
        functionName: 'lengthOfLongestSubstring',
        code: `func lengthOfLongestSubstring(s string) int {

}`,
      },
    ]);

    // Problem 5: Group Anagrams
    console.log('Creating Problem 5: Group Anagrams...');
    const groupAnagrams = await problemRepo.save({
      slug: 'group-anagrams',
      title: 'Group Anagrams',
      description: `Given an array of strings \`strs\`, group **the anagrams** together. You can return the answer in **any order**.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a hash map where the key represents the sorted characters.',
        'All anagrams will have the same sorted representation.',
        'Alternatively, use character count as the key.',
        'Group strings with the same key together.',
      ],
      examples: [
        {
          input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
          output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        },
        {
          input: 'strs = [""]',
          output: '[[""]]',
        },
        {
          input: 'strs = ["a"]',
          output: '[["a"]]',
        },
      ],
      constraints: [
        '1 <= strs.length <= 10^4',
        '0 <= strs[i].length <= 100',
        'strs[i] consists of lowercase English letters.',
      ],
      companies: ['Amazon', 'Facebook', 'Bloomberg'],
      timeComplexity: 'O(n * k log k)',
      spaceComplexity: 'O(n * k)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, stringTag, hashTableTag, sortingTag],
    });

    await testCaseRepo.save([
      {
        problemId: groupAnagrams.id,
        input: '["eat","tea","tan","ate","nat","bat"]',
        expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: groupAnagrams.id,
        input: '[""]',
        expectedOutput: '[[""]]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: groupAnagrams.id,
        input: '["a"]',
        expectedOutput: '[["a"]]',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: groupAnagrams.id,
        input: '["cab","tin","pew","duh","may","ill","buy","bar","max","doc"]',
        expectedOutput: '[["cab"],["tin"],["pew"],["duh"],["may"],["ill"],["buy"],["bar"],["max"],["doc"]]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: groupAnagrams.id,
        input: '["listen","silent","enlist","hello","world"]',
        expectedOutput: '[["listen","silent","enlist"],["hello"],["world"]]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: groupAnagrams.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'groupAnagrams',
        code: `def groupAnagrams(strs):
    """
    :type strs: List[str]
    :rtype: List[List[str]]
    """
    pass`,
      },
      {
        problemId: groupAnagrams.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'groupAnagrams',
        code: `/**
 * @param {string[]} strs
 * @return {string[][]}
 */
function groupAnagrams(strs) {

}`,
      },
      {
        problemId: groupAnagrams.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'groupAnagrams',
        code: `function groupAnagrams(strs: string[]): string[][] {

}`,
      },
      {
        problemId: groupAnagrams.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'groupAnagrams',
        code: `class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {

    }
}`,
      },
      {
        problemId: groupAnagrams.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'groupAnagrams',
        code: `class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {

    }
};`,
      },
      {
        problemId: groupAnagrams.id,
        language: ProgrammingLanguage.C,
        functionName: 'groupAnagrams',
        code: `char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {

}`,
      },
      {
        problemId: groupAnagrams.id,
        language: ProgrammingLanguage.GO,
        functionName: 'groupAnagrams',
        code: `func groupAnagrams(strs []string) [][]string {

}`,
      },
    ]);

    console.log('✅ Part 1 seed completed successfully!');
    console.log('Created first 5 medium problems: Product of Array Except Self, Container With Most Water, 3Sum, Longest Substring Without Repeating Characters, Group Anagrams');
    console.log('\nTotal added in this run:');
    console.log('- 5 problems (all Medium difficulty)');
    console.log('- 27 test cases (mix of example and hidden)');
    console.log('- 35 starter code templates (7 languages × 5 problems)');
    console.log('\nTotal problems: 23/60 (38% of MVP goal)');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
