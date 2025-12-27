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

    // Problem 1: Reverse String
    console.log('Creating Problem 1: Reverse String...');
    const reverseString = await problemRepo.save({
      slug: 'reverse-string',
      title: 'Reverse String',
      description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array **in-place** with \`O(1)\` extra memory.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use two pointers approach - one at the start and one at the end.',
        'Swap characters at both pointers and move them towards the center.',
        'Stop when the pointers meet or cross each other.',
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
      companies: ['Amazon', 'Microsoft', 'Apple'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag, twoPointersTag],
    });

    await testCaseRepo.save([
      {
        problemId: reverseString.id,
        input: '["h","e","l","l","o"]',
        expectedOutput: '["o","l","l","e","h"]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: reverseString.id,
        input: '["H","a","n","n","a","h"]',
        expectedOutput: '["h","a","n","n","a","H"]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: reverseString.id,
        input: '["a"]',
        expectedOutput: '["a"]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: reverseString.id,
        input: '["A"," ","m","a","n",","," ","a"," ","p","l","a","n",","," ","a"," ","c","a","n","a","l",":"," ","P","a","n","a","m","a"]',
        expectedOutput: '["a","m","a","n","a","P"," ",":","l","a","n","a","c"," ","a"," ",",","n","a","l","p"," ","a"," ",",","n","a","m"," ","A"]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def reverseString(s: List[str]) -> None:
    """
    Do not return anything, modify s in-place instead.
    """
    # Write your code here
    pass`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
function reverseString(s) {
    // Write your code here
}`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `/**
 Do not return anything, modify s in-place instead.
 */
function reverseString(s: string[]): void {
    // Write your code here
}`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public void reverseString(char[] s) {
        // Write your code here
    }
}`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    void reverseString(vector<char>& s) {
        // Write your code here
    }
};`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.C,
        code: `void reverseString(char* s, int sSize) {
    // Write your code here
}`,
      },
      {
        problemId: reverseString.id,
        language: ProgrammingLanguage.GO,
        code: `func reverseString(s []byte) {
    // Write your code here
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
        'Use a stack data structure.',
        'Push opening brackets onto the stack.',
        'When you encounter a closing bracket, check if it matches the top of the stack.',
        'The stack should be empty at the end if the string is valid.',
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
      companies: ['Amazon', 'Microsoft', 'Bloomberg'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: validParentheses.id,
        input: '"()"',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: validParentheses.id,
        input: '"()[]{}"',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: validParentheses.id,
        input: '"(]"',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: validParentheses.id,
        input: '"([)]"',
        expectedOutput: 'false',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: validParentheses.id,
        input: '"{[]}"',
        expectedOutput: 'true',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: validParentheses.id,
        input: '"((("',
        expectedOutput: 'false',
        isExample: false,
        isHidden: true,
        order: 6,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def isValid(s: str) -> bool:
    # Write your code here
    pass`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
}`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function isValid(s: string): boolean {
    // Write your code here
}`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public boolean isValid(String s) {
        // Write your code here
    }
}`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    bool isValid(string s) {
        // Write your code here
    }
};`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.C,
        code: `bool isValid(char* s) {
    // Write your code here
}`,
      },
      {
        problemId: validParentheses.id,
        language: ProgrammingLanguage.GO,
        code: `func isValid(s string) bool {
    // Write your code here
}`,
      },
    ]);

    // Problem 3: Maximum Subarray
    console.log('Creating Problem 3: Maximum Subarray...');
    const maxSubarray = await problemRepo.save({
      slug: 'maximum-subarray',
      title: 'Maximum Subarray',
      description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use Kadane\'s algorithm.',
        'Keep track of the current sum and the maximum sum seen so far.',
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
      companies: ['Amazon', 'Microsoft', 'LinkedIn'],
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
    ]);

    await starterCodeRepo.save([
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def maxSubArray(nums: List[int]) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
    // Write your code here
}`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function maxSubArray(nums: number[]): number {
    // Write your code here
}`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your code here
    }
}`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Write your code here
    }
};`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.C,
        code: `int maxSubArray(int* nums, int numsSize) {
    // Write your code here
}`,
      },
      {
        problemId: maxSubarray.id,
        language: ProgrammingLanguage.GO,
        code: `func maxSubArray(nums []int) int {
    // Write your code here
}`,
      },
    ]);

    // Problem 4: Best Time to Buy and Sell Stock
    console.log('Creating Problem 4: Best Time to Buy and Sell Stock...');
    const bestTimeToBuySell = await problemRepo.save({
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
        'For each price, calculate the profit if we sell at that price.',
        'Update the maximum profit if current profit is higher.',
        'We need to buy before we sell, so always check profit with the minimum price from the left.',
      ],
      examples: [
        {
          input: 'prices = [7,1,5,3,6,4]',
          output: '5',
          explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.',
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
      companies: ['Amazon', 'Microsoft', 'Facebook'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: bestTimeToBuySell.id,
        input: '[7,1,5,3,6,4]',
        expectedOutput: '5',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: bestTimeToBuySell.id,
        input: '[7,6,4,3,1]',
        expectedOutput: '0',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: bestTimeToBuySell.id,
        input: '[1,2]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: bestTimeToBuySell.id,
        input: '[2,4,1]',
        expectedOutput: '2',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: bestTimeToBuySell.id,
        input: '[3,3,5,0,0,3,1,4]',
        expectedOutput: '4',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: bestTimeToBuySell.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def maxProfit(prices: List[int]) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: bestTimeToBuySell.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
    // Write your code here
}`,
      },
      {
        problemId: bestTimeToBuySell.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function maxProfit(prices: number[]): number {
    // Write your code here
}`,
      },
      {
        problemId: bestTimeToBuySell.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int maxProfit(int[] prices) {
        // Write your code here
    }
}`,
      },
      {
        problemId: bestTimeToBuySell.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Write your code here
    }
};`,
      },
      {
        problemId: bestTimeToBuySell.id,
        language: ProgrammingLanguage.C,
        code: `int maxProfit(int* prices, int pricesSize) {
    // Write your code here
}`,
      },
      {
        problemId: bestTimeToBuySell.id,
        language: ProgrammingLanguage.GO,
        code: `func maxProfit(prices []int) int {
    // Write your code here
}`,
      },
    ]);

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
        'Use a hash set to track seen numbers.',
        'As you iterate through the array, check if the number is already in the set.',
        'If it is, return true immediately.',
        'If you finish iterating without finding duplicates, return false.',
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
      companies: ['Amazon', 'Apple', 'Adobe'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, hashTableTag],
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
        input: '[0,0]',
        expectedOutput: 'true',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def containsDuplicate(nums: List[int]) -> bool:
    # Write your code here
    pass`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function containsDuplicate(nums) {
    // Write your code here
}`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function containsDuplicate(nums: number[]): boolean {
    // Write your code here
}`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Write your code here
    }
}`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Write your code here
    }
};`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.C,
        code: `bool containsDuplicate(int* nums, int numsSize) {
    // Write your code here
}`,
      },
      {
        problemId: containsDuplicate.id,
        language: ProgrammingLanguage.GO,
        code: `func containsDuplicate(nums []int) bool {
    // Write your code here
}`,
      },
    ]);

    console.log('✅ Part 5 seed completed successfully!');
    console.log('Added 5 easy problems:');
    console.log('  1. Reverse String');
    console.log('  2. Valid Parentheses');
    console.log('  3. Maximum Subarray');
    console.log('  4. Best Time to Buy and Sell Stock');
    console.log('  5. Contains Duplicate');
    console.log('\n📊 Total easy problems: 10/20 (50% complete)');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
