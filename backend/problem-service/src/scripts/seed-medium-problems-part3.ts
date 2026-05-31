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

    // Problem 11: Jump Game
    console.log('Creating Problem 11: Jump Game...');
    const jumpGame = await problemRepo.save({
      slug: 'jump-game',
      title: 'Jump Game',
      description: `You are given an integer array \`nums\`. You are initially positioned at the array's **first index**, and each element in the array represents your maximum jump length at that position.

Return \`true\` if you can reach the last index, or \`false\` otherwise.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a greedy approach: track the farthest position you can reach.',
        'Iterate through the array and update the maximum reachable position.',
        'If at any point your current position exceeds the maximum reachable position, return false.',
        'If you can reach or exceed the last index, return true.',
      ],
      examples: [
        {
          input: 'nums = [2,3,1,1,4]',
          output: 'true',
          explanation: 'Jump 1 step from index 0 to 1, then 3 steps to the last index.',
        },
        {
          input: 'nums = [3,2,1,0,4]',
          output: 'false',
          explanation: 'You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.',
        },
      ],
      constraints: [
        '1 <= nums.length <= 10^4',
        '0 <= nums[i] <= 10^5',
      ],
      companies: ['Amazon', 'Microsoft', 'Google'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: jumpGame.id,
        input: '[2,3,1,1,4]',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: jumpGame.id,
        input: '[3,2,1,0,4]',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: jumpGame.id,
        input: '[0]',
        expectedOutput: 'true',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: jumpGame.id,
        input: '[2,0,0]',
        expectedOutput: 'true',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: jumpGame.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def canJump(nums: List[int]) -> bool:
    # Write your code here
    pass`,
      },
      {
        problemId: jumpGame.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function canJump(nums) {
    // Write your code here
}`,
      },
      {
        problemId: jumpGame.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function canJump(nums: number[]): boolean {
    // Write your code here
}`,
      },
      {
        problemId: jumpGame.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public boolean canJump(int[] nums) {
        // Write your code here
    }
}`,
      },
      {
        problemId: jumpGame.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    bool canJump(vector<int>& nums) {
        // Write your code here
    }
};`,
      },
      {
        problemId: jumpGame.id,
        language: ProgrammingLanguage.C,
        code: `bool canJump(int* nums, int numsSize) {
    // Write your code here
}`,
      },
      {
        problemId: jumpGame.id,
        language: ProgrammingLanguage.GO,
        code: `func canJump(nums []int) bool {
    // Write your code here
}`,
      },
    ]);

    // Problem 12: Unique Paths
    console.log('Creating Problem 12: Unique Paths...');
    const uniquePaths = await problemRepo.save({
      slug: 'unique-paths',
      title: 'Unique Paths',
      description: `There is a robot on an \`m x n\` grid. The robot is initially located at the **top-left corner** (i.e., \`grid[0][0]\`). The robot tries to move to the **bottom-right corner** (i.e., \`grid[m - 1][n - 1]\`). The robot can only move either down or right at any point in time.

Given the two integers \`m\` and \`n\`, return the number of possible unique paths that the robot can take to reach the bottom-right corner.

The test cases are generated so that the answer will be less than or equal to \`2 * 10^9\`.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use dynamic programming: dp[i][j] represents the number of paths to cell (i, j).',
        'Base case: dp[0][j] = 1 and dp[i][0] = 1 (only one way to reach any cell in the first row/column).',
        'Recurrence: dp[i][j] = dp[i-1][j] + dp[i][j-1].',
        'Can optimize space to O(n) by using a 1D array.',
      ],
      examples: [
        {
          input: 'm = 3, n = 7',
          output: '28',
        },
        {
          input: 'm = 3, n = 2',
          output: '3',
          explanation: 'From the top-left corner, there are a total of 3 ways to reach the bottom-right corner:\n1. Right -> Down -> Down\n2. Down -> Down -> Right\n3. Down -> Right -> Down',
        },
      ],
      constraints: [
        '1 <= m, n <= 100',
      ],
      companies: ['Google', 'Amazon', 'Bloomberg'],
      timeComplexity: 'O(m*n)',
      spaceComplexity: 'O(m*n) or O(n) optimized',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [mathTag],
    });

    await testCaseRepo.save([
      {
        problemId: uniquePaths.id,
        input: '3\n7',
        expectedOutput: '28',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: uniquePaths.id,
        input: '3\n2',
        expectedOutput: '3',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: uniquePaths.id,
        input: '1\n1',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: uniquePaths.id,
        input: '10\n10',
        expectedOutput: '48620',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: uniquePaths.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def uniquePaths(m: int, n: int) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: uniquePaths.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number} m
 * @param {number} n
 * @return {number}
 */
function uniquePaths(m, n) {
    // Write your code here
}`,
      },
      {
        problemId: uniquePaths.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function uniquePaths(m: number, n: number): number {
    // Write your code here
}`,
      },
      {
        problemId: uniquePaths.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int uniquePaths(int m, int n) {
        // Write your code here
    }
}`,
      },
      {
        problemId: uniquePaths.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int uniquePaths(int m, int n) {
        // Write your code here
    }
};`,
      },
      {
        problemId: uniquePaths.id,
        language: ProgrammingLanguage.C,
        code: `int uniquePaths(int m, int n) {
    // Write your code here
}`,
      },
      {
        problemId: uniquePaths.id,
        language: ProgrammingLanguage.GO,
        code: `func uniquePaths(m int, n int) int {
    // Write your code here
}`,
      },
    ]);

    // Problem 13: Minimum Path Sum
    console.log('Creating Problem 13: Minimum Path Sum...');
    const minPathSum = await problemRepo.save({
      slug: 'minimum-path-sum',
      title: 'Minimum Path Sum',
      description: `Given a \`m x n\` \`grid\` filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.

**Note:** You can only move either down or right at any point in time.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use dynamic programming: dp[i][j] represents the minimum path sum to cell (i, j).',
        'Base case: dp[0][0] = grid[0][0].',
        'For first row: dp[0][j] = dp[0][j-1] + grid[0][j].',
        'For first column: dp[i][0] = dp[i-1][0] + grid[i][0].',
        'Recurrence: dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j].',
      ],
      examples: [
        {
          input: 'grid = [[1,3,1],[1,5,1],[4,2,1]]',
          output: '7',
          explanation: 'Because the path 1 → 3 → 1 → 1 → 1 minimizes the sum.',
        },
        {
          input: 'grid = [[1,2,3],[4,5,6]]',
          output: '12',
        },
      ],
      constraints: [
        'm == grid.length',
        'n == grid[i].length',
        '1 <= m, n <= 200',
        '0 <= grid[i][j] <= 200',
      ],
      companies: ['Amazon', 'Google', 'Apple'],
      timeComplexity: 'O(m*n)',
      spaceComplexity: 'O(m*n) or O(n) optimized',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: minPathSum.id,
        input: '[[1,3,1],[1,5,1],[4,2,1]]',
        expectedOutput: '7',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: minPathSum.id,
        input: '[[1,2,3],[4,5,6]]',
        expectedOutput: '12',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: minPathSum.id,
        input: '[[1]]',
        expectedOutput: '1',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: minPathSum.id,
        input: '[[1,2],[1,1]]',
        expectedOutput: '3',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: minPathSum.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def minPathSum(grid: List[List[int]]) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: minPathSum.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function minPathSum(grid) {
    // Write your code here
}`,
      },
      {
        problemId: minPathSum.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function minPathSum(grid: number[][]): number {
    // Write your code here
}`,
      },
      {
        problemId: minPathSum.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int minPathSum(int[][] grid) {
        // Write your code here
    }
}`,
      },
      {
        problemId: minPathSum.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int minPathSum(vector<vector<int>>& grid) {
        // Write your code here
    }
};`,
      },
      {
        problemId: minPathSum.id,
        language: ProgrammingLanguage.C,
        code: `int minPathSum(int** grid, int gridSize, int* gridColSize) {
    // Write your code here
}`,
      },
      {
        problemId: minPathSum.id,
        language: ProgrammingLanguage.GO,
        code: `func minPathSum(grid [][]int) int {
    // Write your code here
}`,
      },
    ]);

    // Problem 14: Coin Change
    console.log('Creating Problem 14: Coin Change...');
    const coinChange = await problemRepo.save({
      slug: 'coin-change',
      title: 'Coin Change',
      description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use dynamic programming: dp[i] represents the minimum coins needed for amount i.',
        'Base case: dp[0] = 0 (0 coins needed for amount 0).',
        'For each amount from 1 to target, try all coins.',
        'Recurrence: dp[i] = min(dp[i], dp[i - coin] + 1) for each coin.',
        'If dp[amount] is still infinity/max, return -1.',
      ],
      examples: [
        {
          input: 'coins = [1,2,5], amount = 11',
          output: '3',
          explanation: '11 = 5 + 5 + 1',
        },
        {
          input: 'coins = [2], amount = 3',
          output: '-1',
        },
        {
          input: 'coins = [1], amount = 0',
          output: '0',
        },
      ],
      constraints: [
        '1 <= coins.length <= 12',
        '1 <= coins[i] <= 2^31 - 1',
        '0 <= amount <= 10^4',
      ],
      companies: ['Amazon', 'Microsoft', 'Google'],
      timeComplexity: 'O(amount * coins.length)',
      spaceComplexity: 'O(amount)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: coinChange.id,
        input: '[1,2,5]\n11',
        expectedOutput: '3',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: coinChange.id,
        input: '[2]\n3',
        expectedOutput: '-1',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: coinChange.id,
        input: '[1]\n0',
        expectedOutput: '0',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: coinChange.id,
        input: '[1,2,5]\n100',
        expectedOutput: '20',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: coinChange.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def coinChange(coins: List[int], amount: int) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: coinChange.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
function coinChange(coins, amount) {
    // Write your code here
}`,
      },
      {
        problemId: coinChange.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function coinChange(coins: number[], amount: number): number {
    // Write your code here
}`,
      },
      {
        problemId: coinChange.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int coinChange(int[] coins, int amount) {
        // Write your code here
    }
}`,
      },
      {
        problemId: coinChange.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // Write your code here
    }
};`,
      },
      {
        problemId: coinChange.id,
        language: ProgrammingLanguage.C,
        code: `int coinChange(int* coins, int coinsSize, int amount) {
    // Write your code here
}`,
      },
      {
        problemId: coinChange.id,
        language: ProgrammingLanguage.GO,
        code: `func coinChange(coins []int, amount int) int {
    // Write your code here
}`,
      },
    ]);

    // Problem 15: Word Break
    console.log('Creating Problem 15: Word Break...');
    const wordBreak = await problemRepo.save({
      slug: 'word-break',
      title: 'Word Break',
      description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

**Note** that the same word in the dictionary may be reused multiple times in the segmentation.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use dynamic programming: dp[i] represents whether s[0..i-1] can be segmented.',
        'Base case: dp[0] = true (empty string can be segmented).',
        'For each position i, check all possible previous positions j.',
        'If dp[j] is true and s[j..i-1] is in wordDict, then dp[i] = true.',
        'Use a set for O(1) word lookups.',
      ],
      examples: [
        {
          input: 's = "leetcode", wordDict = ["leet","code"]',
          output: 'true',
          explanation: 'Return true because "leetcode" can be segmented as "leet code".',
        },
        {
          input: 's = "applepenapple", wordDict = ["apple","pen"]',
          output: 'true',
          explanation: 'Return true because "applepenapple" can be segmented as "apple pen apple". Note that you are allowed to reuse a dictionary word.',
        },
        {
          input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]',
          output: 'false',
        },
      ],
      constraints: [
        '1 <= s.length <= 300',
        '1 <= wordDict.length <= 1000',
        '1 <= wordDict[i].length <= 20',
        's and wordDict[i] consist of only lowercase English letters.',
        'All the strings of wordDict are unique.',
      ],
      companies: ['Amazon', 'Google', 'Facebook'],
      timeComplexity: 'O(n^2)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: wordBreak.id,
        input: '"leetcode"\n["leet","code"]',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: wordBreak.id,
        input: '"applepenapple"\n["apple","pen"]',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: wordBreak.id,
        input: '"catsandog"\n["cats","dog","sand","and","cat"]',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: wordBreak.id,
        input: '"aaaaaaa"\n["aaaa","aaa"]',
        expectedOutput: 'true',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: wordBreak.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def wordBreak(s: str, wordDict: List[str]) -> bool:
    # Write your code here
    pass`,
      },
      {
        problemId: wordBreak.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {boolean}
 */
function wordBreak(s, wordDict) {
    // Write your code here
}`,
      },
      {
        problemId: wordBreak.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function wordBreak(s: string, wordDict: string[]): boolean {
    // Write your code here
}`,
      },
      {
        problemId: wordBreak.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        // Write your code here
    }
}`,
      },
      {
        problemId: wordBreak.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        // Write your code here
    }
};`,
      },
      {
        problemId: wordBreak.id,
        language: ProgrammingLanguage.C,
        code: `bool wordBreak(char* s, char** wordDict, int wordDictSize) {
    // Write your code here
}`,
      },
      {
        problemId: wordBreak.id,
        language: ProgrammingLanguage.GO,
        code: `func wordBreak(s string, wordDict []string) bool {
    // Write your code here
}`,
      },
    ]);

    console.log('✅ Part 3 seed completed successfully!');
    console.log('Added 5 medium problems:');
    console.log('  11. Jump Game');
    console.log('  12. Unique Paths');
    console.log('  13. Minimum Path Sum');
    console.log('  14. Coin Change');
    console.log('  15. Word Break');
    console.log('\n📊 Total medium problems: 15/15 (100% complete)');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
