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
    const stringTag = tags.find(t => t.slug === 'string')!;
    const hashTableTag = tags.find(t => t.slug === 'hash-table')!;
    const arrayTag = tags.find(t => t.slug === 'array')!;
    const dpTag = tags.find(t => t.slug === 'dynamic-programming')!;

    // Problem 1: Minimum Window Substring
    console.log('Creating Problem 1: Minimum Window Substring...');
    const minWindowSubstring = await problemRepo.save({
      slug: 'minimum-window-substring',
      title: 'Minimum Window Substring',
      description: `Given two strings \`s\` and \`t\` of lengths \`m\` and \`n\` respectively, return *the **minimum window substring** of* \`s\` *such that every character in* \`t\` *(including duplicates) is included in the window*. If there is no such substring, return *the empty string* \`""\`.

The testcases will be generated such that the answer is **unique**.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a sliding window approach with two pointers.',
        'Keep a hash map to track character frequencies in t.',
        'Expand the window by moving right pointer until all characters are covered.',
        'Contract the window from left to find the minimum size.',
      ],
      examples: [
        {
          input: 's = "ADOBECODEBANC", t = "ABC"',
          output: '"BANC"',
          explanation: 'The minimum window substring "BANC" includes \'A\', \'B\', and \'C\' from string t.',
        },
        {
          input: 's = "a", t = "a"',
          output: '"a"',
          explanation: 'The entire string s is the minimum window.',
        },
        {
          input: 's = "a", t = "aa"',
          output: '""',
          explanation: 'Both \'a\'s from t must be included in the window. Since the largest window of s only has one \'a\', return empty string.',
        },
      ],
      constraints: [
        'm == s.length',
        'n == t.length',
        '1 <= m, n <= 10^5',
        's and t consist of uppercase and lowercase English letters.',
      ],
      companies: ['Facebook', 'Amazon', 'Google'],
      timeComplexity: 'O(m + n)',
      spaceComplexity: 'O(m + n)',
      timeLimitMs: 3000,
      memoryLimitMb: 256,
      tags: [stringTag, hashTableTag],
    });

    await testCaseRepo.save([
      {
        problemId: minWindowSubstring.id,
        input: '"ADOBECODEBANC"\n"ABC"',
        expectedOutput: '"BANC"',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: minWindowSubstring.id,
        input: '"a"\n"a"',
        expectedOutput: '"a"',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: minWindowSubstring.id,
        input: '"a"\n"aa"',
        expectedOutput: '""',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: minWindowSubstring.id,
        input: '"ab"\n"b"',
        expectedOutput: '"b"',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: minWindowSubstring.id,
        input: '"abc"\n"cba"',
        expectedOutput: '"abc"',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: minWindowSubstring.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def minWindow(s: str, t: str) -> str:
    # Write your code here
    pass`,
      },
      {
        problemId: minWindowSubstring.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {string} s
 * @param {string} t
 * @return {string}
 */
function minWindow(s, t) {
    // Write your code here
}`,
      },
      {
        problemId: minWindowSubstring.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function minWindow(s: string, t: string): string {
    // Write your code here
}`,
      },
      {
        problemId: minWindowSubstring.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public String minWindow(String s, String t) {
        // Write your code here
    }
}`,
      },
      {
        problemId: minWindowSubstring.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    string minWindow(string s, string t) {
        // Write your code here
    }
};`,
      },
      {
        problemId: minWindowSubstring.id,
        language: ProgrammingLanguage.C,
        code: `char* minWindow(char* s, char* t) {
    // Write your code here
}`,
      },
      {
        problemId: minWindowSubstring.id,
        language: ProgrammingLanguage.GO,
        code: `func minWindow(s string, t string) string {
    // Write your code here
}`,
      },
    ]);

    // Problem 2: Sliding Window Maximum
    console.log('Creating Problem 2: Sliding Window Maximum...');
    const slidingWindowMaximum = await problemRepo.save({
      slug: 'sliding-window-maximum',
      title: 'Sliding Window Maximum',
      description: `You are given an array of integers \`nums\`, there is a sliding window of size \`k\` which is moving from the very left of the array to the very right. You can only see the \`k\` numbers in the window. Each time the sliding window moves right by one position.

Return *the max sliding window*.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a deque to store indices of elements in decreasing order of their values.',
        'The front of the deque always contains the index of the maximum element in the current window.',
        'Remove indices from the front if they are outside the current window.',
        'Remove indices from the back if their values are less than the current element (they can never be maximum).',
      ],
      examples: [
        {
          input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3',
          output: '[3,3,5,5,6,7]',
          explanation: `Window position                Max
---------------               -----
[1  3  -1] -3  5  3  6  7       3
 1 [3  -1  -3] 5  3  6  7       3
 1  3 [-1  -3  5] 3  6  7       5
 1  3  -1 [-3  5  3] 6  7       5
 1  3  -1  -3 [5  3  6] 7       6
 1  3  -1  -3  5 [3  6  7]      7`,
        },
        {
          input: 'nums = [1], k = 1',
          output: '[1]',
        },
      ],
      constraints: [
        '1 <= nums.length <= 10^5',
        '-10^4 <= nums[i] <= 10^4',
        '1 <= k <= nums.length',
      ],
      companies: ['Amazon', 'Google', 'Microsoft'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(k)',
      timeLimitMs: 3000,
      memoryLimitMb: 256,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: slidingWindowMaximum.id,
        input: '[1,3,-1,-3,5,3,6,7]\n3',
        expectedOutput: '[3,3,5,5,6,7]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: slidingWindowMaximum.id,
        input: '[1]\n1',
        expectedOutput: '[1]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: slidingWindowMaximum.id,
        input: '[1,-1]\n1',
        expectedOutput: '[1,-1]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: slidingWindowMaximum.id,
        input: '[9,11]\n2',
        expectedOutput: '[11]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: slidingWindowMaximum.id,
        input: '[7,2,4]\n2',
        expectedOutput: '[7,4]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: slidingWindowMaximum.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def maxSlidingWindow(nums: List[int], k: int) -> List[int]:
    # Write your code here
    pass`,
      },
      {
        problemId: slidingWindowMaximum.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function maxSlidingWindow(nums, k) {
    // Write your code here
}`,
      },
      {
        problemId: slidingWindowMaximum.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function maxSlidingWindow(nums: number[], k: number): number[] {
    // Write your code here
}`,
      },
      {
        problemId: slidingWindowMaximum.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        // Write your code here
    }
}`,
      },
      {
        problemId: slidingWindowMaximum.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        // Write your code here
    }
};`,
      },
      {
        problemId: slidingWindowMaximum.id,
        language: ProgrammingLanguage.C,
        code: `int* maxSlidingWindow(int* nums, int numsSize, int k, int* returnSize) {
    // Write your code here
}`,
      },
      {
        problemId: slidingWindowMaximum.id,
        language: ProgrammingLanguage.GO,
        code: `func maxSlidingWindow(nums []int, k int) []int {
    // Write your code here
}`,
      },
    ]);

    // Problem 3: Best Time to Buy and Sell Stock III
    console.log('Creating Problem 3: Best Time to Buy and Sell Stock III...');
    const bestTimeToBuySellStockIII = await problemRepo.save({
      slug: 'best-time-to-buy-and-sell-stock-iii',
      title: 'Best Time to Buy and Sell Stock III',
      description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`ith\` day.

Find the maximum profit you can achieve. You may complete **at most two transactions**.

**Note:** You may not engage in multiple transactions simultaneously (i.e., you must sell the stock before you buy again).`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use dynamic programming with state machines.',
        'Track four states: buy1, sell1, buy2, sell2.',
        'buy1 = max(buy1, -price), sell1 = max(sell1, buy1 + price).',
        'buy2 = max(buy2, sell1 - price), sell2 = max(sell2, buy2 + price).',
      ],
      examples: [
        {
          input: 'prices = [3,3,5,0,0,3,1,4]',
          output: '6',
          explanation: 'Buy on day 4 (price = 0) and sell on day 6 (price = 3), profit = 3-0 = 3.\nThen buy on day 7 (price = 1) and sell on day 8 (price = 4), profit = 4-1 = 3.',
        },
        {
          input: 'prices = [1,2,3,4,5]',
          output: '4',
          explanation: 'Buy on day 1 (price = 1) and sell on day 5 (price = 5), profit = 5-1 = 4.\nNote that you cannot buy on day 1, buy on day 2 and sell them later, as you are engaging multiple transactions at the same time. You must sell before buying again.',
        },
        {
          input: 'prices = [7,6,4,3,1]',
          output: '0',
          explanation: 'In this case, no transaction is done, i.e. max profit = 0.',
        },
      ],
      constraints: [
        '1 <= prices.length <= 10^5',
        '0 <= prices[i] <= 10^5',
      ],
      companies: ['Amazon', 'Google', 'Facebook'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: bestTimeToBuySellStockIII.id,
        input: '[3,3,5,0,0,3,1,4]',
        expectedOutput: '6',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
        input: '[1,2,3,4,5]',
        expectedOutput: '4',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
        input: '[7,6,4,3,1]',
        expectedOutput: '0',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
        input: '[1]',
        expectedOutput: '0',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
        input: '[2,1,2,0,1]',
        expectedOutput: '2',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: bestTimeToBuySellStockIII.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def maxProfit(prices: List[int]) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
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
        problemId: bestTimeToBuySellStockIII.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function maxProfit(prices: number[]): number {
    // Write your code here
}`,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int maxProfit(int[] prices) {
        // Write your code here
    }
}`,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Write your code here
    }
};`,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
        language: ProgrammingLanguage.C,
        code: `int maxProfit(int* prices, int pricesSize) {
    // Write your code here
}`,
      },
      {
        problemId: bestTimeToBuySellStockIII.id,
        language: ProgrammingLanguage.GO,
        code: `func maxProfit(prices []int) int {
    // Write your code here
}`,
      },
    ]);

    // Problem 4: Word Search II
    console.log('Creating Problem 4: Word Search II...');
    const wordSearchII = await problemRepo.save({
      slug: 'word-search-ii',
      title: 'Word Search II',
      description: `Given an \`m x n\` \`board\` of characters and a list of strings \`words\`, return *all words on the board*.

Each word must be constructed from letters of sequentially adjacent cells, where **adjacent cells** are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Build a Trie from the words list for efficient prefix matching.',
        'Use DFS/backtracking from each cell in the board.',
        'As you explore, traverse the Trie to check if current path forms a valid prefix.',
        'Mark cells as visited during DFS and unmark after backtracking.',
      ],
      examples: [
        {
          input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]',
          output: '["eat","oath"]',
        },
        {
          input: 'board = [["a","b"],["c","d"]], words = ["abcb"]',
          output: '[]',
        },
      ],
      constraints: [
        'm == board.length',
        'n == board[i].length',
        '1 <= m, n <= 12',
        'board[i][j] is a lowercase English letter.',
        '1 <= words.length <= 3 * 10^4',
        '1 <= words[i].length <= 10',
        'words[i] consists of lowercase English letters.',
        'All the strings of words are unique.',
      ],
      companies: ['Google', 'Amazon', 'Microsoft'],
      timeComplexity: 'O(M * N * 4^L)',
      spaceComplexity: 'O(N)',
      timeLimitMs: 5000,
      memoryLimitMb: 256,
      tags: [arrayTag, stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: wordSearchII.id,
        input: '[["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]]\n["oath","pea","eat","rain"]',
        expectedOutput: '["eat","oath"]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: wordSearchII.id,
        input: '[["a","b"],["c","d"]]\n["abcb"]',
        expectedOutput: '[]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: wordSearchII.id,
        input: '[["a"]]\n["a"]',
        expectedOutput: '["a"]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: wordSearchII.id,
        input: '[["a","b"],["c","d"]]\n["ab","cb","ad","bd","ac","ca","da","bc","db","adcb","dabc","abb","acb"]',
        expectedOutput: '["ab","ac","bd","ca","db"]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: wordSearchII.id,
        input: '[["o","a","b","n"],["o","t","a","e"],["a","h","k","r"],["a","f","l","v"]]\n["oa","oaa"]',
        expectedOutput: '["oa","oaa"]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: wordSearchII.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def findWords(board: List[List[str]], words: List[str]) -> List[str]:
    # Write your code here
    pass`,
      },
      {
        problemId: wordSearchII.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {character[][]} board
 * @param {string[]} words
 * @return {string[]}
 */
function findWords(board, words) {
    // Write your code here
}`,
      },
      {
        problemId: wordSearchII.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function findWords(board: string[][], words: string[]): string[] {
    // Write your code here
}`,
      },
      {
        problemId: wordSearchII.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public List<String> findWords(char[][] board, String[] words) {
        // Write your code here
    }
}`,
      },
      {
        problemId: wordSearchII.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        // Write your code here
    }
};`,
      },
      {
        problemId: wordSearchII.id,
        language: ProgrammingLanguage.C,
        code: `char** findWords(char** board, int boardSize, int* boardColSize, char** words, int wordsSize, int* returnSize) {
    // Write your code here
}`,
      },
      {
        problemId: wordSearchII.id,
        language: ProgrammingLanguage.GO,
        code: `func findWords(board [][]byte, words []string) []string {
    // Write your code here
}`,
      },
    ]);

    // Problem 5: Burst Balloons
    console.log('Creating Problem 5: Burst Balloons...');
    const burstBalloons = await problemRepo.save({
      slug: 'burst-balloons',
      title: 'Burst Balloons',
      description: `You are given \`n\` balloons, indexed from \`0\` to \`n - 1\`. Each balloon is painted with a number on it represented by an array \`nums\`. You are asked to burst all the balloons.

If you burst the \`ith\` balloon, you will get \`nums[i - 1] * nums[i] * nums[i + 1]\` coins. If \`i - 1\` or \`i + 1\` goes out of bounds of the array, then treat it as if there is a balloon with a \`1\` painted on it.

Return *the maximum coins you can collect by bursting the balloons wisely*.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Think backwards: instead of which balloon to burst first, think which balloon to burst last in a range.',
        'Add dummy balloons with value 1 at both ends.',
        'Use dynamic programming: dp[i][j] = max coins from bursting balloons in range (i, j).',
        'For each balloon k in (i, j), assume it\'s the last to burst: nums[i] * nums[k] * nums[j] + dp[i][k] + dp[k][j].',
      ],
      examples: [
        {
          input: 'nums = [3,1,5,8]',
          output: '167',
          explanation: 'nums = [3,1,5,8] --> [3,5,8] --> [3,8] --> [8] --> []\ncoins =  3*1*5    +   3*5*8   +  1*3*8  + 1*8*1 = 167',
        },
        {
          input: 'nums = [1,5]',
          output: '10',
        },
      ],
      constraints: [
        'n == nums.length',
        '1 <= n <= 300',
        '0 <= nums[i] <= 100',
      ],
      companies: ['Google', 'Amazon', 'Facebook'],
      timeComplexity: 'O(n^3)',
      spaceComplexity: 'O(n^2)',
      timeLimitMs: 3000,
      memoryLimitMb: 256,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: burstBalloons.id,
        input: '[3,1,5,8]',
        expectedOutput: '167',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: burstBalloons.id,
        input: '[1,5]',
        expectedOutput: '10',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: burstBalloons.id,
        input: '[1]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: burstBalloons.id,
        input: '[9,76,64,21,97,60]',
        expectedOutput: '1088736',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: burstBalloons.id,
        input: '[8,2,6,8,9,8,1,4,1,5,3,0,7,7,0,4,2,2,5]',
        expectedOutput: '3630',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: burstBalloons.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def maxCoins(nums: List[int]) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: burstBalloons.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxCoins(nums) {
    // Write your code here
}`,
      },
      {
        problemId: burstBalloons.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function maxCoins(nums: number[]): number {
    // Write your code here
}`,
      },
      {
        problemId: burstBalloons.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int maxCoins(int[] nums) {
        // Write your code here
    }
}`,
      },
      {
        problemId: burstBalloons.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int maxCoins(vector<int>& nums) {
        // Write your code here
    }
};`,
      },
      {
        problemId: burstBalloons.id,
        language: ProgrammingLanguage.C,
        code: `int maxCoins(int* nums, int numsSize) {
    // Write your code here
}`,
      },
      {
        problemId: burstBalloons.id,
        language: ProgrammingLanguage.GO,
        code: `func maxCoins(nums []int) int {
    // Write your code here
}`,
      },
    ]);

    console.log('✅ Part 3 seed completed successfully!');
    console.log('Added final 5 hard problems:');
    console.log('  1. Minimum Window Substring');
    console.log('  2. Sliding Window Maximum');
    console.log('  3. Best Time to Buy and Sell Stock III');
    console.log('  4. Word Search II');
    console.log('  5. Burst Balloons');
    console.log('\n🎉 HARD PROBLEMS COMPLETE: 15/15 (100%)');
    console.log('📊 Total progress: 50/60 problems (83% complete)');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
