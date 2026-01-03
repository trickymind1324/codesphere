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
    console.log('🐛 Connected to database - Adding 7 more debugging tasks...\n');

    const tagRepo = AppDataSource.getRepository(Tag);
    const problemRepo = AppDataSource.getRepository(Problem);
    const testCaseRepo = AppDataSource.getRepository(TestCase);
    const starterCodeRepo = AppDataSource.getRepository(StarterCode);

    // Get existing tags
    const debuggingTag = await tagRepo.findOne({ where: { slug: 'debugging' } });
    let sqlTag = await tagRepo.findOne({ where: { slug: 'sql' } });
    let goTag = await tagRepo.findOne({ where: { slug: 'go' } });
    let dockerTag = await tagRepo.findOne({ where: { slug: 'docker' } });

    // Create missing tags
    if (!sqlTag) {
      sqlTag = await tagRepo.save({
        slug: 'sql',
        name: 'SQL',
        category: 'topic',
        description: 'SQL related problems',
      });
    }

    if (!goTag) {
      goTag = await tagRepo.save({
        slug: 'go',
        name: 'Go',
        category: 'topic',
        description: 'Go related problems',
      });
    }

    if (!dockerTag) {
      dockerTag = await tagRepo.save({
        slug: 'docker',
        name: 'Docker',
        category: 'topic',
        description: 'Docker related problems',
      });
    }

    console.log('\n📝 Creating 7 more debugging problems...\n');

    // Problem 4: Debug SQL N+1 Query
    console.log('4. Creating "Debug SQL N+1 Query Problem"...');
    const sqlN1 = await problemRepo.save({
      slug: 'debug-sql-n1-query',
      title: 'Debug SQL N+1 Query Problem',
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `An API endpoint is taking 5+ seconds to load a list of users with their posts. Database logs show hundreds of queries being executed for a simple request.

**Performance Issue:**
- Loading 10 users takes 0.5 seconds
- Loading 100 users takes 5+ seconds
- Database executes 1 + N queries (1 for users, N for each user's posts)

**Your Task:**
Fix the N+1 query problem by using proper eager loading to fetch users and their posts efficiently.`,
      acceptanceRate: 0,
      examples: [
        {
          input: '100 users, each with 5 posts',
          output: 'Should execute 2 queries instead of 101 queries',
          explanation: 'Use JOIN to fetch users and posts together',
        },
      ],
      constraints: [
        'Must return all users with their posts',
        'Should execute maximum 2 queries',
        'Use SQL JOINs',
      ],
      hints: [
        'Look into JOINs or subqueries',
        'The relationship should be eagerly loaded',
        'Check the query execution count in logs',
      ],
      companies: [],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag!, sqlTag],
    });

    await testCaseRepo.save([
      {
        problemId: sqlN1.id,
        input: '10 users',
        expectedOutput: 'Maximum 2 queries executed',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: sqlN1.id,
        input: '100 users',
        expectedOutput: 'Maximum 2 queries executed',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: sqlN1.id,
        language: ProgrammingLanguage.SQL,
        functionName: 'getUsersWithPosts',
        code: `-- Fix the N+1 query problem
-- Current approach (SLOW):
SELECT * FROM users;
-- Then for each user:
SELECT * FROM posts WHERE user_id = ?;

-- Your optimized query here:`,
      },
      {
        problemId: sqlN1.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'getUsersWithPosts',
        code: `# Fix the N+1 query problem
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    posts = relationship('Post', back_populates='user')

class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True)
    title = Column(String)
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship('User', back_populates='posts')

# BUG: This creates N+1 queries!
def get_users_with_posts():
    engine = create_engine('postgresql://localhost/mydb')
    Session = sessionmaker(bind=engine)
    session = Session()

    users = session.query(User).all()  # 1 query
    for user in users:
        print(f"{user.name}: {len(user.posts)} posts")  # N queries!

    return users`,
      },
    ]);

    // Problem 5: Fix Race Condition in Counter
    console.log('5. Creating "Fix Race Condition in Counter"...');
    const raceCondition = await problemRepo.save({
      slug: 'fix-race-condition-counter',
      title: 'Fix Race Condition in Counter',
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `A simple counter application has a race condition when multiple goroutines try to increment the counter simultaneously. The final count is incorrect.

**Bug Symptoms:**
- Expected: 1000 increments = counter = 1000
- Actual: counter = 847 (different each run!)
- Multiple goroutines accessing shared state without synchronization

**Your Task:**
Fix the race condition using proper synchronization primitives (mutex) to ensure accurate counting.`,
      acceptanceRate: 0,
      examples: [
        {
          input: '1000 concurrent increments',
          output: 'counter = 1000 (exactly)',
          explanation: 'Use sync.Mutex to protect the shared counter variable',
        },
      ],
      constraints: [
        'Must handle concurrent access from multiple goroutines',
        'Final count must be accurate',
        'Use Go sync.Mutex',
      ],
      hints: [
        'sync.Mutex provides Lock() and Unlock() methods',
        'Critical section should be as small as possible',
        'Remember to unlock after locking',
      ],
      companies: [],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag!, goTag],
    });

    await testCaseRepo.save([
      {
        problemId: raceCondition.id,
        input: '1000 increments',
        expectedOutput: '1000',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: raceCondition.id,
        input: '10000 increments',
        expectedOutput: '10000',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: raceCondition.id,
        language: ProgrammingLanguage.GO,
        functionName: 'Counter',
        code: `package main

import (
    "fmt"
    "sync"
)

// BUG: No synchronization for shared counter!
type Counter struct {
    value int
}

func (c *Counter) Increment() {
    c.value++ // RACE CONDITION!
}

func (c *Counter) Value() int {
    return c.value
}

func main() {
    counter := &Counter{}
    var wg sync.WaitGroup

    // Launch 1000 goroutines
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }

    wg.Wait()
    fmt.Printf("Final count: %d\\n", counter.Value())
}`,
      },
    ]);

    // Problem 6: Debug JWT Token Logout Bug
    console.log('6. Creating "Debug JWT Token Logout Bug"...');
    const jwtBug = await problemRepo.save({
      slug: 'debug-jwt-logout-bug',
      title: 'Debug JWT Token Logout Bug',
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `Users can still access protected routes even after logging out. The JWT token is deleted from the client, but the server still accepts it as valid.

**Security Bug:**
- User clicks "Logout" and token is removed from localStorage
- User can still use the old token for 1 hour (until expiry)
- Backend doesn't track invalidated tokens

**Your Task:**
Implement a token blacklist to invalidate tokens immediately upon logout.`,
      acceptanceRate: 0,
      examples: [
        {
          input: 'User logs out with token "abc123"',
          output: 'Token "abc123" is blacklisted and rejected',
          explanation: 'Store invalidated tokens with TTL equal to remaining token lifetime',
        },
      ],
      constraints: [
        'Must invalidate tokens immediately on logout',
        'Track blacklisted tokens',
        'Token should expire from blacklist after original expiry time',
      ],
      hints: [
        'Store token JTI (JWT ID) in a set or database on logout',
        'Check blacklist before accepting tokens',
        'Use TTL to automatically remove expired tokens from blacklist',
      ],
      companies: [],
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag!],
    });

    await testCaseRepo.save([
      {
        problemId: jwtBug.id,
        input: 'Logout then try to access protected route',
        expectedOutput: 'Token rejected (blacklisted)',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: jwtBug.id,
        input: 'Multiple logouts with same token',
        expectedOutput: 'All attempts rejected',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: jwtBug.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'authSystem',
        code: `// Fix the JWT logout bug
const jwt = require('jsonwebtoken');

const SECRET = 'your-secret-key';
const blacklist = new Set(); // Simple in-memory blacklist

// BUG: No token invalidation on logout!
async function logout(token) {
    // Currently does nothing on server side
    return { message: 'Logged out successfully' };
}

async function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, SECRET);

        // BUG: Doesn't check if token is blacklisted!
        return decoded;
    } catch (err) {
        throw new Error('Invalid token');
    }
}

module.exports = { logout, verifyToken };`,
      },
    ]);

    // Problem 7: Fix Docker Networking Issue
    console.log('7. Creating "Fix Docker Networking Issue"...');
    const dockerNetworking = await problemRepo.save({
      slug: 'fix-docker-networking',
      title: 'Fix Docker Networking Issue',
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `A Node.js application running in Docker cannot connect to a PostgreSQL database in another container. The error is "ECONNREFUSED" when trying to connect to localhost:5432.

**Connection Error:**
- Error: "connect ECONNREFUSED 127.0.0.1:5432"
- Both containers are running
- Database is accessible from host machine

**Your Task:**
Fix the Docker networking issue by using the correct database host.`,
      acceptanceRate: 0,
      examples: [
        {
          input: 'docker-compose with app and db services',
          output: 'App connects to db successfully',
          explanation: 'Use service name instead of "localhost" in Docker network',
        },
      ],
      constraints: [
        'Must work within docker-compose network',
        'Do not use host networking mode',
        'Fix only the database connection URL',
      ],
      hints: [
        'In Docker networks, containers use service names as hostnames',
        'localhost refers to the container itself, not other containers',
        'Check the database service name in docker-compose.yml',
      ],
      companies: [],
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag!, dockerTag],
    });

    await testCaseRepo.save([
      {
        problemId: dockerNetworking.id,
        input: 'Run app in Docker Compose',
        expectedOutput: 'Connected to database',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: dockerNetworking.id,
        input: 'Scale app to 3 replicas',
        expectedOutput: 'All replicas connect successfully',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: dockerNetworking.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'connect',
        code: `// Fix the Docker networking issue
const { Client } = require('pg');

// docker-compose.yml has:
// services:
//   app:
//     ...
//   db:
//     image: postgres:14
//     ...

// BUG: Using localhost instead of service name!
const client = new Client({
    host: 'localhost',  // WRONG!
    port: 5432,
    database: 'mydb',
    user: 'postgres',
    password: 'postgres',
});

async function connect() {
    try {
        await client.connect();
        console.log('Connected to database');
    } catch (err) {
        console.error('Connection error:', err.message);
    }
}

module.exports = { connect };`,
      },
    ]);

    // Problem 8: Fix Off-by-One Error
    console.log('8. Creating "Fix Off-by-One Error in Array"...');
    const offByOne = await problemRepo.save({
      slug: 'fix-off-by-one-error',
      title: 'Fix Off-by-One Error in Array',
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `A function to find the last element in an array is throwing "Index out of bounds" error.

**Bug Symptoms:**
- Error: "IndexError: list index out of range"
- Function works for arrays with multiple elements
- Fails on arrays with 1 element

**Your Task:**
Fix the off-by-one error in the array indexing.`,
      acceptanceRate: 0,
      examples: [
        {
          input: 'arr = [1, 2, 3, 4, 5]',
          output: '5',
          explanation: 'Should return the last element',
        },
        {
          input: 'arr = [42]',
          output: '42',
          explanation: 'Should work for single-element arrays',
        },
      ],
      constraints: [
        'Must work for arrays of any length >= 1',
        'Do not use negative indexing',
        'Fix the indexing logic',
      ],
      hints: [
        'Array indices start at 0',
        'Last element is at index length - 1, not length',
        'Test with arrays of different sizes',
      ],
      companies: [],
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag!],
    });

    await testCaseRepo.save([
      {
        problemId: offByOne.id,
        input: '[1, 2, 3]',
        expectedOutput: '3',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: offByOne.id,
        input: '[42]',
        expectedOutput: '42',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: offByOne.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'getLastElement',
        code: `# Fix the off-by-one error
def get_last_element(arr):
    # BUG: Wrong index!
    return arr[len(arr)]  # IndexError!`,
      },
      {
        problemId: offByOne.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'getLastElement',
        code: `// Fix the off-by-one error
function getLastElement(arr) {
    // BUG: Wrong index!
    return arr[arr.length];  // undefined!
}`,
      },
    ]);

    // Problem 9: Fix Null Pointer Exception
    console.log('9. Creating "Fix Null Pointer Exception"...');
    const nullPointer = await problemRepo.save({
      slug: 'fix-null-pointer',
      title: 'Fix Null Pointer Exception',
      difficulty: ProblemDifficulty.EASY,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `A function to get user email is crashing with "Cannot read property 'email' of null".

**Bug Symptoms:**
- Error: "TypeError: Cannot read property 'email' of null"
- Function works when user exists
- Crashes when user is not found (null)

**Your Task:**
Add proper null checking to prevent the error.`,
      acceptanceRate: 0,
      examples: [
        {
          input: 'user = {name: "John", email: "john@example.com"}',
          output: 'john@example.com',
        },
        {
          input: 'user = null',
          output: 'null',
          explanation: 'Should handle null gracefully',
        },
      ],
      constraints: [
        'Must handle null users',
        'Return null if user is null',
        'Add null check before accessing properties',
      ],
      hints: [
        'Check if user exists before accessing properties',
        'Use optional chaining or if statement',
        'Return early if input is null',
      ],
      companies: [],
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag!],
    });

    await testCaseRepo.save([
      {
        problemId: nullPointer.id,
        input: '{"name": "John", "email": "john@example.com"}',
        expectedOutput: 'john@example.com',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: nullPointer.id,
        input: 'null',
        expectedOutput: 'null',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: nullPointer.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'getUserEmail',
        code: `// Fix the null pointer exception
function getUserEmail(user) {
    // BUG: No null check!
    return user.email;  // Crashes if user is null!
}`,
      },
      {
        problemId: nullPointer.id,
        language: ProgrammingLanguage.PYTHON,
        functionName: 'getUserEmail',
        code: `# Fix the null pointer exception
def get_user_email(user):
    # BUG: No null check!
    return user['email']  # Crashes if user is None!`,
      },
    ]);

    // Problem 10: Fix Async/Await Bug
    console.log('10. Creating "Fix Async/Await Bug"...');
    const asyncBug = await problemRepo.save({
      slug: 'fix-async-await-bug',
      title: 'Fix Async/Await Bug',
      difficulty: ProblemDifficulty.MEDIUM,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      description: `A function that fetches data from an API is returning a Promise object instead of the actual data.

**Bug Symptoms:**
- Function returns: [object Promise]
- Expected: actual data from API
- Async function call is not awaited

**Your Task:**
Fix the async/await usage to properly return the fetched data.`,
      acceptanceRate: 0,
      examples: [
        {
          input: 'API returns {id: 1, name: "Test"}',
          output: '{id: 1, name: "Test"}',
          explanation: 'Should return the actual data, not a Promise',
        },
      ],
      constraints: [
        'Must use async/await',
        'Return actual data, not Promise',
        'Fix the missing await keyword',
      ],
      hints: [
        'Async functions return Promises',
        'Use await to unwrap Promise values',
        'Make sure the calling function is also async',
      ],
      companies: [],
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [debuggingTag!],
    });

    await testCaseRepo.save([
      {
        problemId: asyncBug.id,
        input: 'fetchUser(1)',
        expectedOutput: 'User object, not Promise',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: asyncBug.id,
        input: 'fetchUser(999)',
        expectedOutput: 'Error or null, not Promise',
        isExample: false,
        isHidden: true,
        order: 2,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: asyncBug.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        functionName: 'processUser',
        code: `// Fix the async/await bug
async function fetchUser(id) {
    const response = await fetch(\`/api/users/\${id}\`);
    const data = await response.json();
    return data;
}

// BUG: Missing await!
async function processUser(id) {
    const user = fetchUser(id);  // Returns Promise, not data!
    console.log(user.name);  // undefined!
    return user;
}`,
      },
    ]);

    console.log('\n✅ Successfully created 7 more debugging problems!');
    console.log('\n📊 Summary:');
    console.log('  - Easy: 3 problems (Infinite Recursion, Off-by-One, Null Pointer)');
    console.log('  - Medium: 4 problems (React Memory Leak, Slow API, Race Condition, Docker, Async/Await)');
    console.log('  - Hard: 3 problems (SQL N+1, JWT Bug, Database Deadlock)');
    console.log('\n🎯 Total debugging problems: 10');
    console.log('🎯 Total problems in database: 60/60 (100%)');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
