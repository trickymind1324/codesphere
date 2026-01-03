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
    console.log('🐛 Connected to database - Starting debugging tasks seed...\n');

    const tagRepo = AppDataSource.getRepository(Tag);
    const problemRepo = AppDataSource.getRepository(Problem);
    const testCaseRepo = AppDataSource.getRepository(TestCase);
    const starterCodeRepo = AppDataSource.getRepository(StarterCode);

    // Ensure required tags exist
    console.log('Ensuring tags exist...');
    let debuggingTag = await tagRepo.findOne({ where: { slug: 'debugging' } });
    if (!debuggingTag) {
      debuggingTag = await tagRepo.save({
        slug: 'debugging',
        name: 'Debugging',
        category: 'topic',
        description: 'Debugging related problems',
      });
    }

    let reactTag = await tagRepo.findOne({ where: { slug: 'react' } });
    if (!reactTag) {
      reactTag = await tagRepo.save({
        slug: 'react',
        name: 'React',
        category: 'topic',
        description: 'React related problems',
      });
    }

    let nodejsTag = await tagRepo.findOne({ where: { slug: 'nodejs' } });
    if (!nodejsTag) {
      nodejsTag = await tagRepo.save({
        slug: 'nodejs',
        name: 'Node.js',
        category: 'topic',
        description: 'Node.js related problems',
      });
    }

    console.log('\n📝 Creating debugging problems...\n');

    // Problem 1: Fix React Memory Leak
    console.log('1. Creating "Fix React Memory Leak"...');
    const reactMemoryLeak = await problemRepo.save({
      slug: 'fix-react-memory-leak',
      title: 'Fix React Memory Leak',
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `A React component is causing a memory leak in production. The component fetches data from an API every second using setInterval, but users report that the application slows down over time, especially when navigating between pages.

**Error Symptoms:**
- Browser tab memory usage increases continuously
- Application becomes sluggish after a few minutes
- Warning in console: "Can't perform a React state update on an unmounted component"

**Your Task:**
Fix the memory leak by properly cleaning up the interval when the component unmounts.`,
      acceptanceRate: 0,
      examples: [
        {
          input: 'Component mounts and fetches data every 1000ms',
          output: 'Component should clean up interval on unmount',
          explanation: 'The useEffect hook should return a cleanup function that clears the interval',
        },
      ],
      constraints: [
        'Do not remove the data fetching functionality',
        'Keep the 1-second interval',
        'Must use React hooks (useEffect)',
      ],
      hints: [
        'useEffect can return a cleanup function',
        'clearInterval() stops a running interval',
        'The cleanup function runs when component unmounts',
      ],
      companies: [],
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag, reactTag],
    });

    await testCaseRepo.save([
      {
        problemId: reactMemoryLeak.id,
        input: 'mount component',
        expectedOutput: 'interval cleared on unmount',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: reactMemoryLeak.id,
        input: 'unmount after 5 seconds',
        expectedOutput: 'no memory leak',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: reactMemoryLeak.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'DataFetcher',
        code: `// Fix the memory leak in this component
import React, { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // BUG: Interval is never cleared!
    setInterval(() => {
      fetch('https://api.example.com/data')
        .then(res => res.json())
        .then(setData);
    }, 1000);
  }, []);

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
}

export default DataFetcher;`,
      },
    ]);

    // Problem 2: Fix Slow API Endpoint
    console.log('2. Creating "Fix Slow API Endpoint"...');
    const slowApi = await problemRepo.save({
      slug: 'fix-slow-api-endpoint',
      title: 'Fix Slow API Endpoint',
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `An API endpoint that processes files is timing out. It needs to read 10 large files, but the synchronous approach is taking 10+ seconds.

**Performance Issue:**
- Reading 10 files sequentially takes 10 seconds (1 second each)
- API timeout is set to 5 seconds
- Files can be read independently

**Your Task:**
Optimize the file reading to happen concurrently using async/await and Promise.all().`,
      acceptanceRate: 0,
      examples: [
        {
          input: '10 files, each takes 1 second to read',
          output: 'Total time: ~1 second (concurrent)',
          explanation: 'Use Promise.all() to read all files simultaneously',
        },
      ],
      constraints: [
        'Must read all 10 files',
        'Total execution time should be ~1 second, not 10 seconds',
        'Use Node.js fs.promises',
      ],
      hints: [
        'Promise.all() can run multiple async operations in parallel',
        'fs.promises.readFile returns a promise',
        'Array.map() can create an array of promises',
      ],
      companies: [],
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag, nodejsTag],
    });

    await testCaseRepo.save([
      {
        problemId: slowApi.id,
        input: '10 files',
        expectedOutput: 'Execution time < 2 seconds',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: slowApi.id,
        input: '100 files',
        expectedOutput: 'Execution time < 2 seconds',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: slowApi.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'processFiles',
        code: `// Fix the slow file reading
const fs = require('fs').promises;

async function processFiles() {
    const files = [
        'file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt',
        'file6.txt', 'file7.txt', 'file8.txt', 'file9.txt', 'file10.txt'
    ];

    const results = [];

    // BUG: Reading files sequentially (10 seconds total)!
    for (const file of files) {
        const data = await fs.readFile(file, 'utf8');
        results.push(data);
    }

    return results;
}

module.exports = processFiles;`,
      },
      {
        problemId: slowApi.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'processFiles',
        code: `# Fix the slow file reading
import asyncio

async def process_files():
    files = [
        'file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt',
        'file6.txt', 'file7.txt', 'file8.txt', 'file9.txt', 'file10.txt'
    ]

    results = []

    # BUG: Reading files sequentially (10 seconds total)!
    for file in files:
        with open(file, 'r') as f:
            data = f.read()
            results.append(data)

    return results`,
      },
    ]);

    // Problem 3: Fix Infinite Recursion
    console.log('3. Creating "Fix Infinite Recursion"...');
    const infiniteRecursion = await problemRepo.save({
      slug: 'fix-infinite-recursion',
      title: 'Fix Infinite Recursion',
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `A binary search implementation crashes with "Maximum call stack size exceeded" error.

**Bug Symptoms:**
- Error: "RangeError: Maximum call stack size exceeded"
- Function calls itself infinitely
- Missing base case for recursion termination

**Your Task:**
Fix the infinite recursion by adding the proper base case.`,
      acceptanceRate: 0,
      examples: [
        {
          input: 'arr = [1, 2, 3, 4, 5], target = 3',
          output: '2 (index of target)',
          explanation: 'Binary search should return the index when target is found or -1 if not found',
        },
      ],
      constraints: [
        'Must use recursive approach',
        'Do not convert to iterative',
        'Add proper base case',
      ],
      hints: [
        'Recursion needs a base case to stop',
        'When should binary search stop searching?',
        'Check if left > right',
      ],
      companies: [],
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(log n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag],
    });

    await testCaseRepo.save([
      {
        problemId: infiniteRecursion.id,
        input: '[1, 2, 3, 4, 5], 3',
        expectedOutput: '2',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: infiniteRecursion.id,
        input: '[1, 2, 3, 4, 5], 6',
        expectedOutput: '-1',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: infiniteRecursion.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'binarySearch',
        code: `// Fix the infinite recursion
function binarySearch(arr, target, left = 0, right = arr.length - 1) {
    // BUG: Missing base case!

    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
        return mid;
    }

    if (arr[mid] > target) {
        return binarySearch(arr, target, left, mid - 1);
    } else {
        return binarySearch(arr, target, mid + 1, right);
    }
}

module.exports = binarySearch;`,
      },
      {
        problemId: infiniteRecursion.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'binarySearch',
        code: `# Fix the infinite recursion
def binary_search(arr, target, left=0, right=None):
    if right is None:
        right = len(arr) - 1

    # BUG: Missing base case!

    mid = (left + right) // 2

    if arr[mid] == target:
        return mid

    if arr[mid] > target:
        return binary_search(arr, target, left, mid - 1)
    else:
        return binary_search(arr, target, mid + 1, right)`,
      },
    ]);

    console.log('\n✅ Successfully created 3 debugging problems!');
    console.log('\n📊 Summary:');
    console.log('  - Easy: 1 problem (Infinite Recursion)');
    console.log('  - Medium: 2 problems (React Memory Leak, Slow API)');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
