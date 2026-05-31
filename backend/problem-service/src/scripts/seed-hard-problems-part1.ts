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

    // Problem 1: Median of Two Sorted Arrays
    console.log('Creating Problem 1: Median of Two Sorted Arrays...');
    const medianOfTwoSortedArrays = await problemRepo.save({
      slug: 'median-of-two-sorted-arrays',
      title: 'Median of Two Sorted Arrays',
      description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return **the median** of the two sorted arrays.

The overall run time complexity should be \`O(log (m+n))\`.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use binary search on the smaller array.',
        'The median divides the sorted array into two equal halves.',
        'Find the correct partition point where all elements on the left are smaller than elements on the right.',
        'Handle edge cases: empty arrays, arrays of different sizes.',
      ],
      examples: [
        {
          input: 'nums1 = [1,3], nums2 = [2]',
          output: '2.00000',
          explanation: 'merged array = [1,2,3] and median is 2.',
        },
        {
          input: 'nums1 = [1,2], nums2 = [3,4]',
          output: '2.50000',
          explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.',
        },
      ],
      constraints: [
        'nums1.length == m',
        'nums2.length == n',
        '0 <= m <= 1000',
        '0 <= n <= 1000',
        '1 <= m + n <= 2000',
        '-10^6 <= nums1[i], nums2[i] <= 10^6',
      ],
      companies: ['Google', 'Amazon', 'Microsoft'],
      timeComplexity: 'O(log(min(m,n)))',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag, sortingTag],
    });

    await testCaseRepo.save([
      {
        problemId: medianOfTwoSortedArrays.id,
        input: '[1,3]\n[2]',
        expectedOutput: '2.00000',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        input: '[1,2]\n[3,4]',
        expectedOutput: '2.50000',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        input: '[]\n[1]',
        expectedOutput: '1.00000',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        input: '[2]\n[]',
        expectedOutput: '2.00000',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: medianOfTwoSortedArrays.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    # Write your code here
    pass`,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
function findMedianSortedArrays(nums1, nums2) {
    // Write your code here
}`,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
    // Write your code here
}`,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        // Write your code here
    }
}`,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        // Write your code here
    }
};`,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        language: ProgrammingLanguage.C,
        code: `double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {
    // Write your code here
}`,
      },
      {
        problemId: medianOfTwoSortedArrays.id,
        language: ProgrammingLanguage.GO,
        code: `func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
    // Write your code here
}`,
      },
    ]);

    // Problem 2: Regular Expression Matching
    console.log('Creating Problem 2: Regular Expression Matching...');
    const regexMatching = await problemRepo.save({
      slug: 'regular-expression-matching',
      title: 'Regular Expression Matching',
      description: `Given an input string \`s\` and a pattern \`p\`, implement regular expression matching with support for \`'.'\` and \`'*'\` where:

- \`'.'\` Matches any single character.
- \`'*'\` Matches zero or more of the preceding element.

The matching should cover the **entire** input string (not partial).`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use dynamic programming with a 2D table.',
        'dp[i][j] represents whether s[0..i-1] matches p[0..j-1].',
        'Handle the \'*\' character carefully - it can match zero or more of the preceding element.',
        'Base case: empty string matches empty pattern.',
      ],
      examples: [
        {
          input: 's = "aa", p = "a"',
          output: 'false',
          explanation: '"a" does not match the entire string "aa".',
        },
        {
          input: 's = "aa", p = "a*"',
          output: 'true',
          explanation: '\'*\' means zero or more of the preceding element, \'a\'. Therefore, by repeating \'a\' once, it becomes "aa".',
        },
        {
          input: 's = "ab", p = ".*"',
          output: 'true',
          explanation: '".*" means "zero or more (*) of any character (.)".',
        },
      ],
      constraints: [
        '1 <= s.length <= 20',
        '1 <= p.length <= 30',
        's contains only lowercase English letters.',
        'p contains only lowercase English letters, \'.\', and \'*\'.',
        'It is guaranteed for each appearance of the character \'*\', there will be a previous valid character to match.',
      ],
      companies: ['Google', 'Facebook', 'Amazon'],
      timeComplexity: 'O(m*n)',
      spaceComplexity: 'O(m*n)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [stringTag],
    });

    await testCaseRepo.save([
      {
        problemId: regexMatching.id,
        input: '"aa"\n"a"',
        expectedOutput: 'false',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: regexMatching.id,
        input: '"aa"\n"a*"',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: regexMatching.id,
        input: '"ab"\n".*"',
        expectedOutput: 'true',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: regexMatching.id,
        input: '"mississippi"\n"mis*is*p*."',
        expectedOutput: 'false',
        isExample: false,
        isHidden: true,
        order: 4,
      },
      {
        problemId: regexMatching.id,
        input: '""\n".*"',
        expectedOutput: 'true',
        isExample: false,
        isHidden: true,
        order: 5,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: regexMatching.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def isMatch(s: str, p: str) -> bool:
    # Write your code here
    pass`,
      },
      {
        problemId: regexMatching.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {string} s
 * @param {string} p
 * @return {boolean}
 */
function isMatch(s, p) {
    // Write your code here
}`,
      },
      {
        problemId: regexMatching.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function isMatch(s: string, p: string): boolean {
    // Write your code here
}`,
      },
      {
        problemId: regexMatching.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public boolean isMatch(String s, String p) {
        // Write your code here
    }
}`,
      },
      {
        problemId: regexMatching.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    bool isMatch(string s, string p) {
        // Write your code here
    }
};`,
      },
      {
        problemId: regexMatching.id,
        language: ProgrammingLanguage.C,
        code: `bool isMatch(char* s, char* p) {
    // Write your code here
}`,
      },
      {
        problemId: regexMatching.id,
        language: ProgrammingLanguage.GO,
        code: `func isMatch(s string, p string) bool {
    // Write your code here
}`,
      },
    ]);

    // Problem 3: Merge k Sorted Lists
    console.log('Creating Problem 3: Merge k Sorted Lists...');
    const mergeKLists = await problemRepo.save({
      slug: 'merge-k-sorted-lists',
      title: 'Merge k Sorted Lists',
      description: `You are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return it.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use a min-heap (priority queue) to keep track of the smallest element.',
        'Insert the head of each list into the heap.',
        'Extract the minimum, add it to the result, and insert the next node from that list.',
        'Alternative: Merge lists two at a time using divide and conquer.',
      ],
      examples: [
        {
          input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
          output: '[1,1,2,3,4,4,5,6]',
          explanation: 'The linked-lists are:\n[\n  1->4->5,\n  1->3->4,\n  2->6\n]\nmerging them into one sorted list:\n1->1->2->3->4->4->5->6',
        },
        {
          input: 'lists = []',
          output: '[]',
        },
        {
          input: 'lists = [[]]',
          output: '[]',
        },
      ],
      constraints: [
        'k == lists.length',
        '0 <= k <= 10^4',
        '0 <= lists[i].length <= 500',
        '-10^4 <= lists[i][j] <= 10^4',
        'lists[i] is sorted in ascending order.',
        'The sum of lists[i].length will not exceed 10^4.',
      ],
      companies: ['Amazon', 'Google', 'Microsoft'],
      timeComplexity: 'O(N log k)',
      spaceComplexity: 'O(k)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: mergeKLists.id,
        input: '[[1,4,5],[1,3,4],[2,6]]',
        expectedOutput: '[1,1,2,3,4,4,5,6]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: mergeKLists.id,
        input: '[]',
        expectedOutput: '[]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: mergeKLists.id,
        input: '[[]]',
        expectedOutput: '[]',
        isExample: true,
        isHidden: false,
        order: 3,
      },
      {
        problemId: mergeKLists.id,
        input: '[[1],[0]]',
        expectedOutput: '[0,1]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: mergeKLists.id,
        language: ProgrammingLanguage.PYTHON,
        code: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
def mergeKLists(lists: List[Optional[ListNode]]) -> Optional[ListNode]:
    # Write your code here
    pass`,
      },
      {
        problemId: mergeKLists.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode[]} lists
 * @return {ListNode}
 */
function mergeKLists(lists) {
    // Write your code here
}`,
      },
      {
        problemId: mergeKLists.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `/**
 * Definition for singly-linked list.
 * class ListNode {
 *     val: number
 *     next: ListNode | null
 *     constructor(val?: number, next?: ListNode | null) {
 *         this.val = (val===undefined ? 0 : val)
 *         this.next = (next===undefined ? null : next)
 *     }
 * }
 */
function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
    // Write your code here
}`,
      },
      {
        problemId: mergeKLists.id,
        language: ProgrammingLanguage.JAVA,
        code: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        // Write your code here
    }
}`,
      },
      {
        problemId: mergeKLists.id,
        language: ProgrammingLanguage.CPP,
        code: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        // Write your code here
    }
};`,
      },
      {
        problemId: mergeKLists.id,
        language: ProgrammingLanguage.C,
        code: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */
struct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {
    // Write your code here
}`,
      },
      {
        problemId: mergeKLists.id,
        language: ProgrammingLanguage.GO,
        code: `/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func mergeKLists(lists []*ListNode) *ListNode {
    // Write your code here
}`,
      },
    ]);

    // Problem 4: Trapping Rain Water
    console.log('Creating Problem 4: Trapping Rain Water...');
    const trapRainWater = await problemRepo.save({
      slug: 'trapping-rain-water',
      title: 'Trapping Rain Water',
      description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use two pointers approach from both ends.',
        'Track the maximum height seen from left and right.',
        'Water at position i = min(leftMax, rightMax) - height[i].',
        'Alternative: Use a stack to track decreasing heights.',
      ],
      examples: [
        {
          input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
          output: '6',
          explanation: 'The elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped.',
        },
        {
          input: 'height = [4,2,0,3,2,5]',
          output: '9',
        },
      ],
      constraints: [
        'n == height.length',
        '1 <= n <= 2 * 10^4',
        '0 <= height[i] <= 10^5',
      ],
      companies: ['Amazon', 'Google', 'Apple'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: trapRainWater.id,
        input: '[0,1,0,2,1,0,1,3,2,1,2,1]',
        expectedOutput: '6',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: trapRainWater.id,
        input: '[4,2,0,3,2,5]',
        expectedOutput: '9',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: trapRainWater.id,
        input: '[0,1,0]',
        expectedOutput: '0',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: trapRainWater.id,
        input: '[3,0,2,0,4]',
        expectedOutput: '7',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: trapRainWater.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def trap(height: List[int]) -> int:
    # Write your code here
    pass`,
      },
      {
        problemId: trapRainWater.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
    // Write your code here
}`,
      },
      {
        problemId: trapRainWater.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function trap(height: number[]): number {
    // Write your code here
}`,
      },
      {
        problemId: trapRainWater.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public int trap(int[] height) {
        // Write your code here
    }
}`,
      },
      {
        problemId: trapRainWater.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    int trap(vector<int>& height) {
        // Write your code here
    }
};`,
      },
      {
        problemId: trapRainWater.id,
        language: ProgrammingLanguage.C,
        code: `int trap(int* height, int heightSize) {
    // Write your code here
}`,
      },
      {
        problemId: trapRainWater.id,
        language: ProgrammingLanguage.GO,
        code: `func trap(height []int) int {
    // Write your code here
}`,
      },
    ]);

    // Problem 5: N-Queens
    console.log('Creating Problem 5: N-Queens...');
    const nQueens = await problemRepo.save({
      slug: 'n-queens',
      title: 'N-Queens',
      description: `The **n-queens** puzzle is the problem of placing \`n\` queens on an \`n x n\` chessboard such that no two queens attack each other.

Given an integer \`n\`, return all distinct solutions to the **n-queens puzzle**. You may return the answer in **any order**.

Each solution contains a distinct board configuration of the n-queens' placement, where \`'Q'\` and \`'.'\` both indicate a queen and an empty space, respectively.`,
      difficulty: ProblemDifficulty.HARD,
      status: ProblemStatus.PUBLISHED,
      isPremium: false,
      hints: [
        'Use backtracking to place queens row by row.',
        'Track columns, diagonals, and anti-diagonals that are under attack.',
        'For each row, try placing a queen in each column.',
        'Backtrack if a placement leads to no solution.',
      ],
      examples: [
        {
          input: 'n = 4',
          output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
          explanation: 'There exist two distinct solutions to the 4-queens puzzle.',
        },
        {
          input: 'n = 1',
          output: '[["Q"]]',
        },
      ],
      constraints: [
        '1 <= n <= 9',
      ],
      companies: ['Google', 'Amazon', 'Microsoft'],
      timeComplexity: 'O(N!)',
      spaceComplexity: 'O(N)',
      timeLimitMs: 5000,
      memoryLimitMb: 128,
      tags: [arrayTag],
    });

    await testCaseRepo.save([
      {
        problemId: nQueens.id,
        input: '4',
        expectedOutput: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
        isExample: true,
        isHidden: false,
        order: 1,
      },
      {
        problemId: nQueens.id,
        input: '1',
        expectedOutput: '[["Q"]]',
        isExample: true,
        isHidden: false,
        order: 2,
      },
      {
        problemId: nQueens.id,
        input: '2',
        expectedOutput: '[]',
        isExample: false,
        isHidden: true,
        order: 3,
      },
      {
        problemId: nQueens.id,
        input: '3',
        expectedOutput: '[]',
        isExample: false,
        isHidden: true,
        order: 4,
      },
    ]);

    await starterCodeRepo.save([
      {
        problemId: nQueens.id,
        language: ProgrammingLanguage.PYTHON,
        code: `def solveNQueens(n: int) -> List[List[str]]:
    # Write your code here
    pass`,
      },
      {
        problemId: nQueens.id,
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `/**
 * @param {number} n
 * @return {string[][]}
 */
function solveNQueens(n) {
    // Write your code here
}`,
      },
      {
        problemId: nQueens.id,
        language: ProgrammingLanguage.TYPESCRIPT,
        code: `function solveNQueens(n: number): string[][] {
    // Write your code here
}`,
      },
      {
        problemId: nQueens.id,
        language: ProgrammingLanguage.JAVA,
        code: `class Solution {
    public List<List<String>> solveNQueens(int n) {
        // Write your code here
    }
}`,
      },
      {
        problemId: nQueens.id,
        language: ProgrammingLanguage.CPP,
        code: `class Solution {
public:
    vector<vector<string>> solveNQueens(int n) {
        // Write your code here
    }
};`,
      },
      {
        problemId: nQueens.id,
        language: ProgrammingLanguage.C,
        code: `/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
char*** solveNQueens(int n, int* returnSize, int** returnColumnSizes) {
    // Write your code here
}`,
      },
      {
        problemId: nQueens.id,
        language: ProgrammingLanguage.GO,
        code: `func solveNQueens(n int) [][]string {
    // Write your code here
}`,
      },
    ]);

    console.log('✅ Part 1 seed completed successfully!');
    console.log('Added 5 hard problems:');
    console.log('  1. Median of Two Sorted Arrays');
    console.log('  2. Regular Expression Matching');
    console.log('  3. Merge k Sorted Lists');
    console.log('  4. Trapping Rain Water');
    console.log('  5. N-Queens');
    console.log('\n📊 Total hard problems: 5/15 (33% complete)');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
