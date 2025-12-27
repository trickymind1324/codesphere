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
    const mathTag = tags.find(t => t.slug === 'math')!;

    // Problem 1: Roman to Integer
    console.log('Creating Problem 1: Roman to Integer...');
    const romanToInt = await problemRepo.save({
      slug: 'roman-to-integer',
      title: 'Roman to Integer',
      description: `Roman numerals are represented by seven different symbols: \`I\`, \`V\`, \`X\`, \`L\`, \`C\`, \`D\` and \`M\`.

\`\`\`
Symbol       Value
I             1
V             5
X             10
L             50
C             100
D             500
M             1000
\`\`\`

For example, \`2\` is written as \`II\` in Roman numeral, just two ones added together. \`12\` is written as \`XII\`, which is simply \`X + II\`. The number \`27\` is written as \`XXVII\`, which is \`XX + V + II\`.

Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not \`IIII\`. Instead, the number four is written as \`IV\`. Because the one is before the five we subtract it making four. The same principle applies to the number nine, which is written as \`IX\`. There are six instances where subtraction is used:

- \`I\` can be placed before \`V\` (5) and \`X\` (10) to make 4 and 9.
- \`X\` can be placed before \`L\` (50) and \`C\` (100) to make 40 and 90.
- \`C\` can be placed before \`D\` (500) and \`M\` (1000) to make 400 and 900.

Given a roman numeral, convert it to an integer.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a hash map to store the value of each Roman numeral symbol.',
        'Iterate through the string from left to right.',
        'If the current symbol value is less than the next symbol value, subtract it; otherwise, add it.',
        'Handle the last character separately since it doesn\'t have a next character.',
      ],
      examples: [
        {
          input: 's = "III"',
          output: '3',
          explanation: 'III = 3.',
        },
        {
          input: 's = "LVIII"',
          output: '58',
          explanation: 'L = 50, V= 5, III = 3.',
        },
        {
          input: 's = "MCMXCIV"',
          output: '1994',
          explanation: 'M = 1000, CM = 900, XC = 90 and IV = 4.',
        },
      ],
      constraints: [
        '1 <= s.length <= 15',
        's contains only the characters (\'I\', \'V\', \'X\', \'L\', \'C\', \'D\', \'M\').',
        'It is guaranteed that s is a valid roman numeral in the range [1, 3999].',
      ],
      companies: ['Amazon', 'Microsoft', 'Facebook'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag, hashTableTag, mathTag],
    });

    await testCaseRepo.save([
      {
        problemId: romanToInt.id,
        input: '"III"',
        expectedOutput: '3',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: romanToInt.id,
        input: '"LVIII"',
        expectedOutput: '58',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: romanToInt.id,
        input: '"MCMXCIV"',
        expectedOutput: '1994',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: romanToInt.id,
        input: '"IV"',
        expectedOutput: '4',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: romanToInt.id,
        input: '"IX"',
        expectedOutput: '9',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: romanToInt.id,
        input: '"CDXLIV"',
        expectedOutput: '444',
        isExample: false,
        isHidden: true,
        order: 6,
      },
      {
        problemId: romanToInt.id,
        input: '"MMMCMXCIX"',
        expectedOutput: '3999',
        isExample: false,
        isHidden: true,
        order: 7,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: romanToInt.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def romanToInt(s: str) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: romanToInt.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {string} s
 * @return {number}
 */
function romanToInt(s) {
    // Write your code here
}`,
      },
      {
        problemId: romanToInt.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function romanToInt(s: string): number {
    // Write your code here
}`,
      },
      {
        problemId: romanToInt.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int romanToInt(String s) {
        // Write your code here
    }
}`,
      },
      {
        problemId: romanToInt.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int romanToInt(string s) {
        // Write your code here
    }
};`,
      },
      {
        problemId: romanToInt.id,
        language: ProgrammingLanguage.C,
        code: `int romanToInt(char* s) {
    // Write your code here
}`,
      },
      {
        problemId: romanToInt.id,
        language: ProgrammingLanguage.GO,
        code: `func romanToInt(s string) int {
    // Write your code here
}`,
      },
    ]);

    // Problem 2: Longest Common Prefix
    console.log('Creating Problem 2: Longest Common Prefix...');
    const longestCommonPrefix = await problemRepo.save({
      slug: 'longest-common-prefix',
      title: 'Longest Common Prefix',
      description: `Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string \`""\`.`,
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Start by comparing characters at the same position across all strings.',
        'Use the first string as a reference and compare it with others.',
        'Stop when you find a mismatch or reach the end of any string.',
        'Alternative: Sort the array and compare only the first and last strings.',
      ],
      examples: [
        {
          input: 'strs = ["flower","flow","flight"]',
          output: '"fl"',
        },
        {
          input: 'strs = ["dog","racecar","car"]',
          output: '""',
          explanation: 'There is no common prefix among the input strings.',
        },
      ],
      constraints: [
        '1 <= strs.length <= 200',
        '0 <= strs[i].length <= 200',
        'strs[i] consists of only lowercase English letters.',
      ],
      companies: ['Amazon', 'Microsoft', 'Google'],
      timeComplexity: 'O(S)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: longestCommonPrefix.id,
        input: '["flower","flow","flight"]',
        expectedOutput: '"fl"',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: longestCommonPrefix.id,
        input: '["dog","racecar","car"]',
        expectedOutput: '""',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: longestCommonPrefix.id,
        input: '["ab","a"]',
        expectedOutput: '"a"',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: longestCommonPrefix.id,
        input: '[""]',
        expectedOutput: '""',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: longestCommonPrefix.id,
        input: '["a"]',
        expectedOutput: '"a"',
        isExample: false,
        isHidden: true,
        order: 5,
      },
      {
        problemId: longestCommonPrefix.id,
        input: '["reflower","flow","flight"]',
        expectedOutput: '""',
        isExample: false,
        isHidden: true,
        order: 6,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: longestCommonPrefix.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def longestCommonPrefix(strs: List[str]) -> str:
    # Write your code here
    pass`,
      },
      {
        problemId: longestCommonPrefix.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {string[]} strs
 * @return {string}
 */
function longestCommonPrefix(strs) {
    // Write your code here
}`,
      },
      {
        problemId: longestCommonPrefix.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function longestCommonPrefix(strs: string[]): string {
    // Write your code here
}`,
      },
      {
        problemId: longestCommonPrefix.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public String longestCommonPrefix(String[] strs) {
        // Write your code here
    }
}`,
      },
      {
        problemId: longestCommonPrefix.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        // Write your code here
    }
};`,
      },
      {
        problemId: longestCommonPrefix.id,
        language: ProgrammingLanguage.C,
        code: `char* longestCommonPrefix(char** strs, int strsSize) {
    // Write your code here
}`,
      },
      {
        problemId: longestCommonPrefix.id,
        language: ProgrammingLanguage.GO,
        code: `func longestCommonPrefix(strs []string) string {
    // Write your code here
}`,
      },
    ]);

    console.log('✅ Part 6 seed completed successfully!');
    console.log('Added final 2 easy problems:');
    console.log('  1. Roman to Integer');
    console.log('  2. Longest Common Prefix');
    console.log('\n🎉 EASY PROBLEMS COMPLETE: 20/20 (100%)');
    console.log('📊 Total progress: 35/60 problems (58% complete)');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
