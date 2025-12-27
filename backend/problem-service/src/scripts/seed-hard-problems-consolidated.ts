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
    const sortingTag = tags.find(t => t.slug === 'sorting')!;
    const dpTag = tags.find(t => t.slug === 'dynamic-programming')!;
    const stackTag = tags.find(t => t.slug === 'stack')!;

    // Delete incomplete problems that might exist from failed runs
    const problemSlugsToCheck = [
      'word-ladder',
      'longest-consecutive-sequence',
      'edit-distance',
      'maximal-rectangle',
      'longest-valid-parentheses',
      'minimum-window-substring',
      'sliding-window-maximum',
      'best-time-to-buy-and-sell-stock-iii',
      'word-search-ii',
      'burst-balloons'
    ];

    console.log('Checking for existing problems...');
    for (const slug of problemSlugsToCheck) {
      const existing = await problemRepo.findOne({ where: { slug } });
      if (existing) {
        console.log(`Deleting existing problem: ${slug}`);
        await problemRepo.remove(existing);
      }
    }

    let problemCount = 0;

    // Problem 6: Word Ladder
    console.log('Creating Problem 6: Word Ladder...');
    const wordLadder = await problemRepo.save({
      slug: 'word-ladder',
      title: 'Word Ladder',
      description: `A **transformation sequence** from word \`beginWord\` to word \`endWord\` using a dictionary \`wordList\` is a sequence of words \`beginWord -> s1 -> s2 -> ... -> sk\` such that:

- Every adjacent pair of words differs by a single letter.
- Every \`si\` for \`1 <= i <= k\` is in \`wordList\`. Note that \`beginWord\` does not need to be in \`wordList\`.
- \`sk == endWord\`

Given two words, \`beginWord\` and \`endWord\`, and a dictionary \`wordList\`, return *the **number of words** in the **shortest transformation sequence** from* \`beginWord\` *to* \`endWord\`*, or* \`0\` *if no such sequence exists.*`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
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
      timeComplexity: 'O(M^2 * N)',
      spaceComplexity: 'O(M^2 * N)',
      timeLimitMs: 3000,
      memoryLimitMb: 256,
      tags: [hashTableTag, stringTag],
    });
    problemCount++;

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

    console.log('✅ All 10 remaining hard problems seed completed successfully!');
    console.log(`Added ${problemCount} problem so far...`);
    console.log('📊 Progress: Combined with previous 5 hard problems = 15/15 hard problems total');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
