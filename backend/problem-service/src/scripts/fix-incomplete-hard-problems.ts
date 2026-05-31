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

async function fixProblems() {
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
    const hashTableTag = tags.find(t => t.slug === 'hash-table')!;
    const arrayTag = tags.find(t => t.slug === 'array')!;
    const stringTag = tags.find(t => t.slug === 'string')!;
    const stackTag = tags.find(t => t.slug === 'stack')!;

    // Fix Problem 1: Word Ladder
    console.log('\n1️⃣ Fixing Word Ladder...');
    const wordLadder = await problemRepo.findOne({ where: { slug: 'word-ladder' } });
    if (wordLadder) {
      // Update problem with full data
      await problemRepo.update(wordLadder.id, {
        description: `A **transformation sequence** from word \`beginWord\` to word \`endWord\` using a dictionary \`wordList\` is a sequence of words \`beginWord -> s1 -> s2 -> ... -> sk\` such that:

- Every adjacent pair of words differs by a single letter.
- Every \`si\` for \`1 <= i <= k\` is in \`wordList\`. Note that \`beginWord\` does not need to be in \`wordList\`.
- \`sk == endWord\`

Given two words, \`beginWord\` and \`endWord\`, and a dictionary \`wordList\`, return *the **number of words** in the **shortest transformation sequence** from* \`beginWord\` *to* \`endWord\`*, or* \`0\` *if no such sequence exists.*`,
        hints: [
          'Use BFS to find the shortest path in an unweighted graph.',
          'Treat each word as a node and create edges between words that differ by one letter.',
          'To optimize, instead of comparing all pairs, try replacing each character with all 26 letters.',
          'Use a set for O(1) lookup of valid words.',
        ],
        examples: [
          {
            input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
            output: '5',
            explanation: 'One shortest transformation sequence is "hit" -> "hot" -> "dot" -> "dog" -> "cog", which is 5 words long.',
          },
          {
            input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]',
            output: '0',
            explanation: 'The endWord "cog" is not in wordList, therefore there is no valid transformation sequence.',
          },
        ],
        constraints: [
          '1 <= beginWord.length <= 10',
          'endWord.length == beginWord.length',
          '1 <= wordList.length <= 5000',
          'wordList[i].length == beginWord.length',
          'beginWord, endWord, and wordList[i] consist of lowercase English letters.',
          'beginWord != endWord',
          'All the words in wordList are unique.',
        ],
        companies: ['Amazon', 'Google', 'Facebook'],
      });

      // Delete existing test cases and starter codes
      await testCaseRepo.delete({ problemId: wordLadder.id });
      await starterCodeRepo.delete({ problemId: wordLadder.id });

      // Add test cases
      await testCaseRepo.save([
        {
          problemId: wordLadder.id,
          input: '"hit"\n"cog"\n["hot","dot","dog","lot","log","cog"]',
          expectedOutput: '5',
          isExample: true,
          isHidden: false,
          order: 1,
        },
        {
          problemId: wordLadder.id,
          input: '"hit"\n"cog"\n["hot","dot","dog","lot","log"]',
          expectedOutput: '0',
          isExample: true,
          isHidden: false,
          order: 2,
        },
        {
          problemId: wordLadder.id,
          input: '"a"\n"c"\n["a","b","c"]',
          expectedOutput: '2',
          isExample: false,
          isHidden: true,
          order: 3,
        },
        {
          problemId: wordLadder.id,
          input: '"hot"\n"dog"\n["hot","dog"]',
          expectedOutput: '0',
          isExample: false,
          isHidden: true,
          order: 4,
        },
        {
          problemId: wordLadder.id,
          input: '"red"\n"tax"\n["ted","tex","red","tax","tad","den","rex","pee"]',
          expectedOutput: '4',
          isExample: false,
          isHidden: true,
          order: 5,
        },
      ]);

      // Add starter codes
      await starterCodeRepo.save([
        {
          problemId: wordLadder.id,
          language: ProgrammingLanguage.PYTHON,
          code: `def ladderLength(beginWord: str, endWord: str, wordList: List[str]) -> int:
    # Write your code here
    pass`,
        },
        {
          problemId: wordLadder.id,
          language: ProgrammingLanguage.JAVASCRIPT,
          code: `/**
 * @param {string} beginWord
 * @param {string} endWord
 * @param {string[]} wordList
 * @return {number}
 */
function ladderLength(beginWord, endWord, wordList) {
    // Write your code here
}`,
        },
        {
          problemId: wordLadder.id,
          language: ProgrammingLanguage.TYPESCRIPT,
          code: `function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
    // Write your code here
}`,
        },
        {
          problemId: wordLadder.id,
          language: ProgrammingLanguage.JAVA,
          code: `class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        // Write your code here
    }
}`,
        },
        {
          problemId: wordLadder.id,
          language: ProgrammingLanguage.CPP,
          code: `class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        // Write your code here
    }
};`,
        },
        {
          problemId: wordLadder.id,
          language: ProgrammingLanguage.C,
          code: `int ladderLength(char* beginWord, char* endWord, char** wordList, int wordListSize) {
    // Write your code here
}`,
        },
        {
          problemId: wordLadder.id,
          language: ProgrammingLanguage.GO,
          code: `func ladderLength(beginWord string, endWord string, wordList []string) int {
    // Write your code here
}`,
        },
      ]);

      console.log('✅ Fixed Word Ladder');
    } else {
      console.log('⚠️ Word Ladder not found in database');
    }

    // Fix Problem 2: Edit Distance
    console.log('\n2️⃣ Fixing Edit Distance...');
    const editDistance = await problemRepo.findOne({ where: { slug: 'edit-distance' } });
    if (editDistance) {
      await problemRepo.update(editDistance.id, {
        description: `Given two strings \`word1\` and \`word2\`, return *the minimum number of operations required to convert \`word1\` to \`word2\`*.

You have the following three operations permitted on a word:

- Insert a character
- Delete a character
- Replace a character`,
        hints: [
          'Use dynamic programming with a 2D table.',
          'dp[i][j] represents the minimum operations to convert word1[0..i-1] to word2[0..j-1].',
          'If characters match, dp[i][j] = dp[i-1][j-1].',
          'If they don\'t match, take minimum of insert, delete, or replace: min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1.',
        ],
        examples: [
          {
            input: 'word1 = "horse", word2 = "ros"',
            output: '3',
            explanation: 'horse -> rorse (replace \'h\' with \'r\')\nrorse -> rose (remove \'r\')\nrose -> ros (remove \'e\')',
          },
          {
            input: 'word1 = "intention", word2 = "execution"',
            output: '5',
            explanation: 'intention -> inention (remove \'t\')\ninention -> enention (replace \'i\' with \'e\')\nenention -> exention (replace \'n\' with \'x\')\nexention -> exection (replace \'n\' with \'c\')\nexection -> execution (insert \'u\')',
          },
        ],
        constraints: [
          '0 <= word1.length, word2.length <= 500',
          'word1 and word2 consist of lowercase English letters.',
        ],
        companies: ['Google', 'Amazon', 'Microsoft'],
      });

      await testCaseRepo.delete({ problemId: editDistance.id });
      await starterCodeRepo.delete({ problemId: editDistance.id });

      await testCaseRepo.save([
        {
          problemId: editDistance.id,
          input: '"horse"\n"ros"',
          expectedOutput: '3',
          isExample: true,
          isHidden: false,
          order: 1,
        },
        {
          problemId: editDistance.id,
          input: '"intention"\n"execution"',
          expectedOutput: '5',
          isExample: true,
          isHidden: false,
          order: 2,
        },
        {
          problemId: editDistance.id,
          input: '""\n""',
          expectedOutput: '0',
          isExample: false,
          isHidden: true,
          order: 3,
        },
        {
          problemId: editDistance.id,
          input: '"a"\n"b"',
          expectedOutput: '1',
          isExample: false,
          isHidden: true,
          order: 4,
        },
        {
          problemId: editDistance.id,
          input: '"abc"\n""',
          expectedOutput: '3',
          isExample: false,
          isHidden: true,
          order: 5,
        },
      ]);

      await starterCodeRepo.save([
        {
          problemId: editDistance.id,
          language: ProgrammingLanguage.PYTHON,
          code: `def minDistance(word1: str, word2: str) -> int:
    # Write your code here
    pass`,
        },
        {
          problemId: editDistance.id,
          language: ProgrammingLanguage.JAVASCRIPT,
          code: `/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
function minDistance(word1, word2) {
    // Write your code here
}`,
        },
        {
          problemId: editDistance.id,
          language: ProgrammingLanguage.TYPESCRIPT,
          code: `function minDistance(word1: string, word2: string): number {
    // Write your code here
}`,
        },
        {
          problemId: editDistance.id,
          language: ProgrammingLanguage.JAVA,
          code: `class Solution {
    public int minDistance(String word1, String word2) {
        // Write your code here
    }
}`,
        },
        {
          problemId: editDistance.id,
          language: ProgrammingLanguage.CPP,
          code: `class Solution {
public:
    int minDistance(string word1, string word2) {
        // Write your code here
    }
};`,
        },
        {
          problemId: editDistance.id,
          language: ProgrammingLanguage.C,
          code: `int minDistance(char* word1, char* word2) {
    // Write your code here
}`,
        },
        {
          problemId: editDistance.id,
          language: ProgrammingLanguage.GO,
          code: `func minDistance(word1 string, word2 string) int {
    // Write your code here
}`,
        },
      ]);

      console.log('✅ Fixed Edit Distance');
    } else {
      console.log('⚠️ Edit Distance not found in database');
    }

    // Fix Problem 3: Maximal Rectangle
    console.log('\n3️⃣ Fixing Maximal Rectangle...');
    const maximalRectangle = await problemRepo.findOne({ where: { slug: 'maximal-rectangle' } });
    if (maximalRectangle) {
      await problemRepo.update(maximalRectangle.id, {
        description: `Given a \`rows x cols\` binary matrix filled with 0's and 1's, find the largest rectangle containing only 1's and return *its area*.`,
        hints: [
          'Treat each row as the base of a histogram.',
          'Use the "largest rectangle in histogram" algorithm for each row.',
          'Maintain heights array where height[j] is the number of consecutive 1s up to current row at column j.',
          'Use a stack to efficiently compute the maximum rectangle for each histogram.',
        ],
        examples: [
          {
            input: 'matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]',
            output: '6',
            explanation: 'The maximal rectangle is shown in the image with area = 6.',
          },
          {
            input: 'matrix = [["0"]]',
            output: '0',
          },
          {
            input: 'matrix = [["1"]]',
            output: '1',
          },
        ],
        constraints: [
          'rows == matrix.length',
          'cols == matrix[i].length',
          '1 <= row, cols <= 200',
          'matrix[i][j] is \'0\' or \'1\'.',
        ],
        companies: ['Amazon', 'Google', 'Microsoft'],
      });

      await testCaseRepo.delete({ problemId: maximalRectangle.id });
      await starterCodeRepo.delete({ problemId: maximalRectangle.id });

      await testCaseRepo.save([
        {
          problemId: maximalRectangle.id,
          input: '[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]',
          expectedOutput: '6',
          isExample: true,
          isHidden: false,
          order: 1,
        },
        {
          problemId: maximalRectangle.id,
          input: '[["0"]]',
          expectedOutput: '0',
          isExample: true,
          isHidden: false,
          order: 2,
        },
        {
          problemId: maximalRectangle.id,
          input: '[["1"]]',
          expectedOutput: '1',
          isExample: true,
          isHidden: false,
          order: 3,
        },
        {
          problemId: maximalRectangle.id,
          input: '[["1","1"],["1","1"]]',
          expectedOutput: '4',
          isExample: false,
          isHidden: true,
          order: 4,
        },
        {
          problemId: maximalRectangle.id,
          input: '[["0","0","0"],["0","0","0"],["0","0","0"]]',
          expectedOutput: '0',
          isExample: false,
          isHidden: true,
          order: 5,
        },
      ]);

      await starterCodeRepo.save([
        {
          problemId: maximalRectangle.id,
          language: ProgrammingLanguage.PYTHON,
          code: `def maximalRectangle(matrix: List[List[str]]) -> int:
    # Write your code here
    pass`,
        },
        {
          problemId: maximalRectangle.id,
          language: ProgrammingLanguage.JAVASCRIPT,
          code: `/**
 * @param {character[][]} matrix
 * @return {number}
 */
function maximalRectangle(matrix) {
    // Write your code here
}`,
        },
        {
          problemId: maximalRectangle.id,
          language: ProgrammingLanguage.TYPESCRIPT,
          code: `function maximalRectangle(matrix: string[][]): number {
    // Write your code here
}`,
        },
        {
          problemId: maximalRectangle.id,
          language: ProgrammingLanguage.JAVA,
          code: `class Solution {
    public int maximalRectangle(char[][] matrix) {
        // Write your code here
    }
}`,
        },
        {
          problemId: maximalRectangle.id,
          language: ProgrammingLanguage.CPP,
          code: `class Solution {
public:
    int maximalRectangle(vector<vector<char>>& matrix) {
        // Write your code here
    }
};`,
        },
        {
          problemId: maximalRectangle.id,
          language: ProgrammingLanguage.C,
          code: `int maximalRectangle(char** matrix, int matrixSize, int* matrixColSize) {
    // Write your code here
}`,
        },
        {
          problemId: maximalRectangle.id,
          language: ProgrammingLanguage.GO,
          code: `func maximalRectangle(matrix [][]byte) int {
    // Write your code here
}`,
        },
      ]);

      console.log('✅ Fixed Maximal Rectangle');
    } else {
      console.log('⚠️ Maximal Rectangle not found in database');
    }

    // Fix Problem 4: Longest Valid Parentheses
    console.log('\n4️⃣ Fixing Longest Valid Parentheses...');
    const longestValidParentheses = await problemRepo.findOne({ where: { slug: 'longest-valid-parentheses' } });
    if (longestValidParentheses) {
      await problemRepo.update(longestValidParentheses.id, {
        description: `Given a string containing just the characters \`'('\` and \`')'\`, return *the length of the longest valid (well-formed) parentheses substring*.`,
        hints: [
          'Use a stack to track indices of unmatched parentheses.',
          'Push -1 initially as a base for valid substrings.',
          'For \'(\', push its index. For \')\', pop and calculate length.',
          'Alternative: Use dynamic programming where dp[i] = length of longest valid substring ending at i.',
        ],
        examples: [
          {
            input: 's = "(()"',
            output: '2',
            explanation: 'The longest valid parentheses substring is "()".',
          },
          {
            input: 's = ")()())"',
            output: '4',
            explanation: 'The longest valid parentheses substring is "()()".',
          },
          {
            input: 's = ""',
            output: '0',
          },
        ],
        constraints: [
          '0 <= s.length <= 3 * 10^4',
          's[i] is \'(\', or \')\'.',
        ],
        companies: ['Amazon', 'Google', 'Facebook'],
      });

      await testCaseRepo.delete({ problemId: longestValidParentheses.id });
      await starterCodeRepo.delete({ problemId: longestValidParentheses.id });

      await testCaseRepo.save([
        {
          problemId: longestValidParentheses.id,
          input: '"(()"',
          expectedOutput: '2',
          isExample: true,
          isHidden: false,
          order: 1,
        },
        {
          problemId: longestValidParentheses.id,
          input: '")()())"',
          expectedOutput: '4',
          isExample: true,
          isHidden: false,
          order: 2,
        },
        {
          problemId: longestValidParentheses.id,
          input: '""',
          expectedOutput: '0',
          isExample: true,
          isHidden: false,
          order: 3,
        },
        {
          problemId: longestValidParentheses.id,
          input: '"(()())"',
          expectedOutput: '6',
          isExample: false,
          isHidden: true,
          order: 4,
        },
        {
          problemId: longestValidParentheses.id,
          input: '"(()()"',
          expectedOutput: '4',
          isExample: false,
          isHidden: true,
          order: 5,
        },
      ]);

      await starterCodeRepo.save([
        {
          problemId: longestValidParentheses.id,
          language: ProgrammingLanguage.PYTHON,
          code: `def longestValidParentheses(s: str) -> int:
    # Write your code here
    pass`,
        },
        {
          problemId: longestValidParentheses.id,
          language: ProgrammingLanguage.JAVASCRIPT,
          code: `/**
 * @param {string} s
 * @return {number}
 */
function longestValidParentheses(s) {
    // Write your code here
}`,
        },
        {
          problemId: longestValidParentheses.id,
          language: ProgrammingLanguage.TYPESCRIPT,
          code: `function longestValidParentheses(s: string): number {
    // Write your code here
}`,
        },
        {
          problemId: longestValidParentheses.id,
          language: ProgrammingLanguage.JAVA,
          code: `class Solution {
    public int longestValidParentheses(String s) {
        // Write your code here
    }
}`,
        },
        {
          problemId: longestValidParentheses.id,
          language: ProgrammingLanguage.CPP,
          code: `class Solution {
public:
    int longestValidParentheses(string s) {
        // Write your code here
    }
};`,
        },
        {
          problemId: longestValidParentheses.id,
          language: ProgrammingLanguage.C,
          code: `int longestValidParentheses(char* s) {
    // Write your code here
}`,
        },
        {
          problemId: longestValidParentheses.id,
          language: ProgrammingLanguage.GO,
          code: `func longestValidParentheses(s string) int {
    // Write your code here
}`,
        },
      ]);

      console.log('✅ Fixed Longest Valid Parentheses');
    } else {
      console.log('⚠️ Longest Valid Parentheses not found in database');
    }

    console.log('\n🎉 All 4 problems have been fixed with complete data!');
    console.log('Each problem now has:');
    console.log('  ✅ Full description');
    console.log('  ✅ Hints (4 per problem)');
    console.log('  ✅ Examples (2-3 per problem)');
    console.log('  ✅ Constraints');
    console.log('  ✅ Test cases (5 per problem)');
    console.log('  ✅ Starter code for all 7 languages');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error fixing problems:', error);
    process.exit(1);
  }
}

fixProblems();
