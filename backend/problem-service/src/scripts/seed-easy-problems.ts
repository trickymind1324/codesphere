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

    // Problem 1: Reverse String
    console.log('Creating Problem 1: Reverse String...');
    const reverseString = await problemRepo.save({
      slug: 'reverse-string',
      title: 'Reverse String',
      description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with O(1) extra memory.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use two pointers approach - one at the beginning and one at the end.',
        'Swap characters at both pointers and move them towards the center.',
      ],
      examples: [
        {
          input: 's = ["h","e","l","l","o"]',
          output: '["o","l","l","e","h"]',
        },
        {
          input: 's = ["H","a","n","n","a","h"]',
          output: '["h","a","n","n","a","H"]',
        },
      ],
      constraints: [
        '1 <= s.length <= 10^5',
        's[i] is a printable ascii character.',
      ],
      companies: ['Google', 'Amazon', 'Microsoft'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag, twoPointersTag],
    });

    await testCaseRepo.save([
      {
        problemId: reverseString.id,
        input: 'hello',
        expectedOutput: 'olleh',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: reverseString.id,
        input: 'Hannah',
        expectedOutput: 'hannaH',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: reverseString.id,
        input: 'a',
        expectedOutput: 'a',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: reverseString.id,
        input: 'ab',
        expectedOutput: 'ba',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: reverseString.id,
        input: 'race car',
        expectedOutput: 'rac ecar',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'reverseString',
        code: `def reverseString(s):
    """
    :type s: str
    :rtype: str
    """
    pass`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'reverseString',
        code: `/**
 * @param {string} s
 * @return {string}
 */
function reverseString(s) {

}`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'reverseString',
        code: `function reverseString(s: string): string {

}`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'reverseString',
        code: `class Solution {
    public String reverseString(String s) {

    }
}`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'reverseString',
        code: `class Solution {
public:
    string reverseString(string s) {

    }
};`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.C,
        functionName: 'reverseString',
        code: `char* reverseString(char* s) {

}`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.GO,
        functionName: 'reverseString',
        code: `func reverseString(s string) string {

}`,
      },
    ]);

    // Problem 2: Valid Parentheses
    console.log('Creating Problem 2: Valid Parentheses...');
    const validParentheses = await problemRepo.save({
      slug: 'valid-parentheses',
      title: 'Valid Parentheses',
      description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a stack to keep track of opening brackets.',
        'When you encounter a closing bracket, check if it matches the top of the stack.',
        'If the stack is empty at the end, all brackets were matched correctly.',
      ],
      examples: [
        {
          input: 's = "()"',
          output: 'true',
        },
        {
          input: 's = "()[]{}"',
          output: 'true',
        },
        {
          input: 's = "(]"',
          output: 'false',
        },
      ],
      constraints: [
        '1 <= s.length <= 10^4',
        's consists of parentheses only \'()[]{}\'.',
      ],
      companies: ['Amazon', 'Microsoft', 'Facebook', 'Google'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: validParentheses.id,
        input: '()',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: validParentheses.id,
        input: '()[]{}',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: validParentheses.id,
        input: '(]',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: validParentheses.id,
        input: '([)]',
        expectedOutput: 'false',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: validParentheses.id,
        input: '{[]}',
        expectedOutput: 'true',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: validParentheses.id,
        input: '',
        expectedOutput: 'true',
        isExample: false,
        isHidden: true,
        order: 6,
      },
      {
        problemId: validParentheses.id,
        input: '(((',
        expectedOutput: 'false',
        isExample: false,
        isHidden: true,
        order: 7,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'isValid',
        code: `def isValid(s):
    """
    :type s: str
    :rtype: bool
    """
    pass`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'isValid',
        code: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {

}`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'isValid',
        code: `function isValid(s: string): boolean {

}`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'isValid',
        code: `class Solution {
    public boolean isValid(String s) {

    }
}`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'isValid',
        code: `class Solution {
public:
    bool isValid(string s) {

    }
};`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.C,
        functionName: 'isValid',
        code: `bool isValid(char* s) {

}`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.GO,
        functionName: 'isValid',
        code: `func isValid(s string) bool {

}`,
      },
    ]);

    // Problem 3: Maximum Subarray
    console.log('Creating Problem 3: Maximum Subarray...');
    const maxSubarray = await problemRepo.save({
      slug: 'maximum-subarray',
      title: 'Maximum Subarray',
      description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A **subarray** is a contiguous non-empty sequence of elements within an array.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use Kadane\'s Algorithm - keep track of the current sum and maximum sum.',
        'If the current sum becomes negative, reset it to 0.',
        'Update the maximum sum whenever the current sum is greater.',
      ],
      examples: [
        {
          input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
          output: '6',
          explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
        },
        {
          input: 'nums = [1]',
          output: '1',
          explanation: 'The subarray [1] has the largest sum 1.',
        },
        {
          input: 'nums = [5,4,-1,7,8]',
          output: '23',
          explanation: 'The subarray [5,4,-1,7,8] has the largest sum 23.',
        },
      ],
      constraints: [
        '1 <= nums.length <= 10^5',
        '-10^4 <= nums[i] <= 10^4',
      ],
      companies: ['Amazon', 'Microsoft', 'Apple', 'LinkedIn'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: maxSubarray.id,
        input: '[-2,1,-3,4,-1,2,1,-5,4]',
        expectedOutput: '6',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: maxSubarray.id,
        input: '[1]',
        expectedOutput: '1',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: maxSubarray.id,
        input: '[5,4,-1,7,8]',
        expectedOutput: '23',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: maxSubarray.id,
        input: '[-1]',
        expectedOutput: '-1',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: maxSubarray.id,
        input: '[-2,-1]',
        expectedOutput: '-1',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: maxSubarray.id,
        input: '[1,2,3,4,5]',
        expectedOutput: '15',
        isExample: false,
        isHidden: true,
        order: 6,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'maxSubArray',
        code: `def maxSubArray(nums):
    """
    :type nums: List[int]
    :rtype: int
    """
    pass`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'maxSubArray',
        code: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {

}`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'maxSubArray',
        code: `function maxSubArray(nums: number[]): number {

}`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'maxSubArray',
        code: `class Solution {
    public int maxSubArray(int[] nums) {

    }
}`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'maxSubArray',
        code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {

    }
};`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.C,
        functionName: 'maxSubArray',
        code: `int maxSubArray(int* nums, int numsSize) {

}`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.GO,
        functionName: 'maxSubArray',
        code: `func maxSubArray(nums []int) int {

}`,
      },
    ]);

    // Problem 4: Best Time to Buy and Sell Stock
    console.log('Creating Problem 4: Best Time to Buy and Sell Stock...');
    const bestTimeToBuyStock = await problemRepo.save({
      slug: 'best-time-to-buy-and-sell-stock',
      title: 'Best Time to Buy and Sell Stock',
      description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`ith\` day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Keep track of the minimum price seen so far.',
        'For each price, calculate the profit if you sell at that price.',
        'Update the maximum profit accordingly.',
      ],
      examples: [
        {
          input: 'prices = [7,1,5,3,6,4]',
          output: '5',
          explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.',
        },
        {
          input: 'prices = [7,6,4,3,1]',
          output: '0',
          explanation: 'In this case, no transactions are done and the max profit = 0.',
        },
      ],
      constraints: [
        '1 <= prices.length <= 10^5',
        '0 <= prices[i] <= 10^4',
      ],
      companies: ['Amazon', 'Facebook', 'Microsoft', 'Goldman Sachs'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: bestTimeToBuyStock.id,
        input: '[7,1,5,3,6,4]',
        expectedOutput: '5',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: bestTimeToBuyStock.id,
        input: '[7,6,4,3,1]',
        expectedOutput: '0',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: bestTimeToBuyStock.id,
        input: '[1,2]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: bestTimeToBuyStock.id,
        input: '[2,4,1]',
        expectedOutput: '2',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: bestTimeToBuyStock.id,
        input: '[3,2,6,5,0,3]',
        expectedOutput: '4',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: bestTimeToBuyStock.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'maxProfit',
        code: `def maxProfit(prices):
    """
    :type prices: List[int]
    :rtype: int
    """
    pass`,
      },
      {
        problemId: bestTimeToBuyStock.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'maxProfit',
        code: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {

}`,
      },
      {
        problemId: bestTimeToBuyStock.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'maxProfit',
        code: `function maxProfit(prices: number[]): number {

}`,
      },
      {
        problemId: bestTimeToBuyStock.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'maxProfit',
        code: `class Solution {
    public int maxProfit(int[] prices) {

    }
}`,
      },
      {
        problemId: bestTimeToBuyStock.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'maxProfit',
        code: `class Solution {
public:
    int maxProfit(vector<int>& prices) {

    }
};`,
      },
      {
        problemId: bestTimeToBuyStock.id,
        language: ProgrammingLanguage.C,
        functionName: 'maxProfit',
        code: `int maxProfit(int* prices, int pricesSize) {

}`,
      },
      {
        problemId: bestTimeToBuyStock.id,
        language: ProgrammingLanguage.GO,
        functionName: 'maxProfit',
        code: `func maxProfit(prices []int) int {

}`,
      },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log('Created 4 problems: Reverse String, Valid Parentheses, Maximum Subarray, Best Time to Buy and Sell Stock');
    console.log('\nNote: Due to file size constraints, remaining 6 problems will be added in separate seed files.');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
