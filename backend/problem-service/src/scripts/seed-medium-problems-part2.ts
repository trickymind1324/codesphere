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

    // Problem 6: Longest Palindromic Substring
    console.log('Creating Problem 6: Longest Palindromic Substring...');
    const longestPalindrome = await problemRepo.save({
      slug: 'longest-palindromic-substring',
      title: 'Longest Palindromic Substring',
      description: `Given a string \`s\`, return the longest palindromic substring in \`s\`.

A **palindrome** is a string that reads the same forward and backward.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Expand around center approach: for each character, expand outward.',
        'Consider both odd-length and even-length palindromes.',
        'For odd-length: center is a single character. For even-length: center is between two characters.',
        'Alternative: Dynamic programming approach with O(n^2) time and space.',
      ],
      examples: [
        {
          input: 's = "babad"',
          output: '"bab"',
          explanation: 'Note: "aba" is also a valid answer.',
        },
        {
          input: 's = "cbbd"',
          output: '"bb"',
        },
      ],
      constraints: [
        '1 <= s.length <= 1000',
        's consist of only digits and English letters.',
      ],
      companies: ['Amazon', 'Microsoft', 'Adobe'],
      timeComplexity: 'O(n^2)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: longestPalindrome.id,
        input: '"babad"',
        expectedOutput: '"bab"',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: longestPalindrome.id,
        input: '"cbbd"',
        expectedOutput: '"bb"',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: longestPalindrome.id,
        input: '"a"',
        expectedOutput: '"a"',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: longestPalindrome.id,
        input: '"ac"',
        expectedOutput: '"a"',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: longestPalindrome.id,
        input: '"racecar"',
        expectedOutput: '"racecar"',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: longestPalindrome.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'longestPalindrome',
        code: `def longestPalindrome(s):
    """
    :type s: str
    :rtype: str
    """
    pass`,
      },
      {
        problemId: longestPalindrome.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'longestPalindrome',
        code: `/**
 * @param {string} s
 * @return {string}
 */
function longestPalindrome(s) {

}`,
      },
      {
        problemId: longestPalindrome.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'longestPalindrome',
        code: `function longestPalindrome(s: string): string {

}`,
      },
      {
        problemId: longestPalindrome.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'longestPalindrome',
        code: `class Solution {
    public String longestPalindrome(String s) {

    }
}`,
      },
      {
        problemId: longestPalindrome.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'longestPalindrome',
        code: `class Solution {
public:
    string longestPalindrome(string s) {

    }
};`,
      },
      {
        problemId: longestPalindrome.id,
        language: ProgrammingLanguage.C,
        functionName: 'longestPalindrome',
        code: `char* longestPalindrome(char* s) {

}`,
      },
      {
        problemId: longestPalindrome.id,
        language: ProgrammingLanguage.GO,
        functionName: 'longestPalindrome',
        code: `func longestPalindrome(s string) string {

}`,
      },
    ]);

    // Problem 7: Zigzag Conversion
    console.log('Creating Problem 7: Zigzag Conversion...');
    const zigzagConversion = await problemRepo.save({
      slug: 'zigzag-conversion',
      title: 'Zigzag Conversion',
      description: `The string \`"PAYPALISHIRING"\` is written in a zigzag pattern on a given number of rows like this:

\`\`\`
P   A   H   N
A P L S I I G
Y   I   R
\`\`\`

And then read line by line: \`"PAHNAPLSIIGYIR"\`

Write the code that will take a string and make this conversion given a number of rows:

\`string convert(string s, int numRows);\``,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Create an array of strings, one for each row.',
        'Iterate through the string and append each character to the appropriate row.',
        'Use a variable to track the current row and direction (going down or up).',
        'Change direction when reaching the top or bottom row.',
      ],
      examples: [
        {
          input: 's = "PAYPALISHIRING", numRows = 3',
          output: '"PAHNAPLSIIGYIR"',
        },
        {
          input: 's = "PAYPALISHIRING", numRows = 4',
          output: '"PINALSIGYAHRPI"',
          explanation: 'P     I    N\nA   L S  I G\nY A   H R\nP     I',
        },
        {
          input: 's = "A", numRows = 1',
          output: '"A"',
        },
      ],
      constraints: [
        '1 <= s.length <= 1000',
        's consists of English letters (lower-case and upper-case), \',\' and \'.\'.',
        '1 <= numRows <= 1000',
      ],
      companies: ['Amazon', 'Microsoft'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: zigzagConversion.id,
        input: '{"s": "PAYPALISHIRING", "numRows": 3}',
        expectedOutput: '"PAHNAPLSIIGYIR"',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: zigzagConversion.id,
        input: '{"s": "PAYPALISHIRING", "numRows": 4}',
        expectedOutput: '"PINALSIGYAHRPI"',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: zigzagConversion.id,
        input: '{"s": "A", "numRows": 1}',
        expectedOutput: '"A"',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: zigzagConversion.id,
        input: '{"s": "AB", "numRows": 1}',
        expectedOutput: '"AB"',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: zigzagConversion.id,
        input: '{"s": "ABCD", "numRows": 2}',
        expectedOutput: '"ACBD"',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: zigzagConversion.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'convert',
        code: `def convert(s, numRows):
    """
    :type s: str
    :type numRows: int
    :rtype: str
    """
    pass`,
      },
      {
        problemId: zigzagConversion.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'convert',
        code: `/**
 * @param {string} s
 * @param {number} numRows
 * @return {string}
 */
function convert(s, numRows) {

}`,
      },
      {
        problemId: zigzagConversion.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'convert',
        code: `function convert(s: string, numRows: number): string {

}`,
      },
      {
        problemId: zigzagConversion.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'convert',
        code: `class Solution {
    public String convert(String s, int numRows) {

    }
}`,
      },
      {
        problemId: zigzagConversion.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'convert',
        code: `class Solution {
public:
    string convert(string s, int numRows) {

    }
};`,
      },
      {
        problemId: zigzagConversion.id,
        language: ProgrammingLanguage.C,
        functionName: 'convert',
        code: `char* convert(char* s, int numRows) {

}`,
      },
      {
        problemId: zigzagConversion.id,
        language: ProgrammingLanguage.GO,
        functionName: 'convert',
        code: `func convert(s string, numRows int) string {

}`,
      },
    ]);

    // Problem 8: String to Integer (atoi)
    console.log('Creating Problem 8: String to Integer (atoi)...');
    const atoi = await problemRepo.save({
      slug: 'string-to-integer-atoi',
      title: 'String to Integer (atoi)',
      description: `Implement the \`myAtoi(string s)\` function, which converts a string to a 32-bit signed integer (similar to C/C++'s \`atoi\` function).

The algorithm for \`myAtoi(string s)\` is as follows:

1. Read in and ignore any leading whitespace.
2. Check if the next character (if not already at the end of the string) is \`'-'\` or \`'+'\`. Read this character in if it is either. This determines if the final result is negative or positive respectively. Assume the result is positive if neither is present.
3. Read in next the characters until the next non-digit character or the end of the input is reached. The rest of the string is ignored.
4. Convert these digits into an integer (i.e. \`"123" -> 123\`, \`"0032" -> 32\`). If no digits were read, then the integer is \`0\`. Change the sign as necessary (from step 2).
5. If the integer is out of the 32-bit signed integer range \`[-2^31, 2^31 - 1]\`, then clamp the integer so that it remains in the range. Specifically, integers less than \`-2^31\` should be clamped to \`-2^31\`, and integers greater than \`2^31 - 1\` should be clamped to \`2^31 - 1\`.
6. Return the integer as the final result.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Handle leading whitespace first.',
        'Check for optional sign (+/-).',
        'Read digits one by one and build the number.',
        'Handle overflow by clamping to INT_MIN and INT_MAX.',
      ],
      examples: [
        {
          input: 's = "42"',
          output: '42',
        },
        {
          input: 's = "   -42"',
          output: '-42',
        },
        {
          input: 's = "4193 with words"',
          output: '4193',
        },
      ],
      constraints: [
        '0 <= s.length <= 200',
        's consists of English letters (lower-case and upper-case), digits (0-9), \' \', \'+\', \'-\', and \'.\'.',
      ],
      companies: ['Amazon', 'Microsoft', 'Facebook'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: atoi.id,
        input: '"42"',
        expectedOutput: '42',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: atoi.id,
        input: '"   -42"',
        expectedOutput: '-42',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: atoi.id,
        input: '"4193 with words"',
        expectedOutput: '4193',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: atoi.id,
        input: '"words and 987"',
        expectedOutput: '0',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: atoi.id,
        input: '"-91283472332"',
        expectedOutput: '-2147483648',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: atoi.id,
        input: '"21474836460"',
        expectedOutput: '2147483647',
        isExample: false,
        isHidden: true,
        order: 6,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: atoi.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'myAtoi',
        code: `def myAtoi(s):
    """
    :type s: str
    :rtype: int
    """
    pass`,
      },
      {
        problemId: atoi.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'myAtoi',
        code: `/**
 * @param {string} s
 * @return {number}
 */
function myAtoi(s) {

}`,
      },
      {
        problemId: atoi.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'myAtoi',
        code: `function myAtoi(s: string): number {

}`,
      },
      {
        problemId: atoi.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'myAtoi',
        code: `class Solution {
    public int myAtoi(String s) {

    }
}`,
      },
      {
        problemId: atoi.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'myAtoi',
        code: `class Solution {
public:
    int myAtoi(string s) {

    }
};`,
      },
      {
        problemId: atoi.id,
        language: ProgrammingLanguage.C,
        functionName: 'myAtoi',
        code: `int myAtoi(char* s) {

}`,
      },
      {
        problemId: atoi.id,
        language: ProgrammingLanguage.GO,
        functionName: 'myAtoi',
        code: `func myAtoi(s string) int {

}`,
      },
    ]);

    // Problem 9: Rotate Image
    console.log('Creating Problem 9: Rotate Image...');
    const rotateImage = await problemRepo.save({
      slug: 'rotate-image',
      title: 'Rotate Image',
      description: `You are given an \`n x n\` 2D \`matrix\` representing an image, rotate the image by **90 degrees** (clockwise).

You have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. **DO NOT** allocate another 2D matrix and do the rotation.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Transpose the matrix (swap matrix[i][j] with matrix[j][i]).',
        'Reverse each row.',
        'Alternative: Rotate layer by layer from outside to inside.',
      ],
      examples: [
        {
          input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]',
          output: '[[7,4,1],[8,5,2],[9,6,3]]',
        },
        {
          input: 'matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]',
          output: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]',
        },
      ],
      constraints: [
        'n == matrix.length == matrix[i].length',
        '1 <= n <= 20',
        '-1000 <= matrix[i][j] <= 1000',
      ],
      companies: ['Amazon', 'Microsoft', 'Apple'],
      timeComplexity: 'O(n^2)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, mathTag],
    });

    await testCaseRepo.save([
      {
        problemId: rotateImage.id,
        input: '[[1,2,3],[4,5,6],[7,8,9]]',
        expectedOutput: '[[7,4,1],[8,5,2],[9,6,3]]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: rotateImage.id,
        input: '[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]',
        expectedOutput: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: rotateImage.id,
        input: '[[1]]',
        expectedOutput: '[[1]]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: rotateImage.id,
        input: '[[1,2],[3,4]]',
        expectedOutput: '[[3,1],[4,2]]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: rotateImage.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'rotate',
        code: `def rotate(matrix):
    """
    :type matrix: List[List[int]]
    :rtype: List[List[int]]
    """
    pass`,
      },
      {
        problemId: rotateImage.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'rotate',
        code: `/**
 * @param {number[][]} matrix
 * @return {number[][]}
 */
function rotate(matrix) {

}`,
      },
      {
        problemId: rotateImage.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'rotate',
        code: `function rotate(matrix: number[][]): number[][] {

}`,
      },
      {
        problemId: rotateImage.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'rotate',
        code: `class Solution {
    public void rotate(int[][] matrix) {

    }
}`,
      },
      {
        problemId: rotateImage.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'rotate',
        code: `class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {

    }
};`,
      },
      {
        problemId: rotateImage.id,
        language: ProgrammingLanguage.C,
        functionName: 'rotate',
        code: `void rotate(int** matrix, int matrixSize, int* matrixColSize) {

}`,
      },
      {
        problemId: rotateImage.id,
        language: ProgrammingLanguage.GO,
        functionName: 'rotate',
        code: `func rotate(matrix [][]int) [][]int {

}`,
      },
    ]);

    // Problem 10: Spiral Matrix
    console.log('Creating Problem 10: Spiral Matrix...');
    const spiralMatrix = await problemRepo.save({
      slug: 'spiral-matrix',
      title: 'Spiral Matrix',
      description: `Given an \`m x n\` \`matrix\`, return all elements of the \`matrix\` in spiral order.`,
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use four pointers for top, bottom, left, and right boundaries.',
        'Traverse right, then down, then left, then up.',
        'After each direction, update the corresponding boundary.',
        'Continue until all elements are visited.',
      ],
      examples: [
        {
          input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]',
          output: '[1,2,3,6,9,8,7,4,5]',
        },
        {
          input: 'matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]',
          output: '[1,2,3,4,8,12,11,10,9,5,6,7]',
        },
      ],
      constraints: [
        'm == matrix.length',
        'n == matrix[i].length',
        '1 <= m, n <= 10',
        '-100 <= matrix[i][j] <= 100',
      ],
      companies: ['Amazon', 'Microsoft', 'Facebook'],
      timeComplexity: 'O(m * n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, mathTag],
    });

    await testCaseRepo.save([
      {
        problemId: spiralMatrix.id,
        input: '[[1,2,3],[4,5,6],[7,8,9]]',
        expectedOutput: '[1,2,3,6,9,8,7,4,5]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: spiralMatrix.id,
        input: '[[1,2,3,4],[5,6,7,8],[9,10,11,12]]',
        expectedOutput: '[1,2,3,4,8,12,11,10,9,5,6,7]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: spiralMatrix.id,
        input: '[[1]]',
        expectedOutput: '[1]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: spiralMatrix.id,
        input: '[[1,2],[3,4]]',
        expectedOutput: '[1,2,4,3]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: spiralMatrix.id,
        input: '[[1,2,3]]',
        expectedOutput: '[1,2,3]',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: spiralMatrix.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'spiralOrder',
        code: `def spiralOrder(matrix):
    """
    :type matrix: List[List[int]]
    :rtype: List[int]
    """
    pass`,
      },
      {
        problemId: spiralMatrix.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'spiralOrder',
        code: `/**
 * @param {number[][]} matrix
 * @return {number[]}
 */
function spiralOrder(matrix) {

}`,
      },
      {
        problemId: spiralMatrix.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        functionName: 'spiralOrder',
        code: `function spiralOrder(matrix: number[][]): number[] {

}`,
      },
      {
        problemId: spiralMatrix.id,
        language: ProgrammingLanguage.JAVA,
        functionName: 'spiralOrder',
        code: `class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {

    }
}`,
      },
      {
        problemId: spiralMatrix.id,
        language: ProgrammingLanguage.CPP,
        functionName: 'spiralOrder',
        code: `class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {

    }
};`,
      },
      {
        problemId: spiralMatrix.id,
        language: ProgrammingLanguage.C,
        functionName: 'spiralOrder',
        code: `int* spiralOrder(int** matrix, int matrixSize, int* matrixColSize, int* returnSize) {

}`,
      },
      {
        problemId: spiralMatrix.id,
        language: ProgrammingLanguage.GO,
        functionName: 'spiralOrder',
        code: `func spiralOrder(matrix [][]int) []int {

}`,
      },
    ]);

    console.log('✅ Part 2 seed completed successfully!');
    console.log('Created 5 more medium problems: Longest Palindromic Substring, Zigzag Conversion, String to Integer (atoi), Rotate Image, Spiral Matrix');
    console.log('\nTotal added in this run:');
    console.log('- 5 problems (all Medium difficulty)');
    console.log('- 25 test cases (mix of example and hidden)');
    console.log('- 35 starter code templates (7 languages × 5 problems)');
    console.log('\nTotal problems: 25/60 (42% of MVP goal)');
    console.log('Medium problems: 10/15 (67%)');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
