import { Problem } from "./types";

export const INITIAL_PROBLEMS: Problem[] = [
  {
    id: "p1",
    title: "Hello World",
    description: "Write a program that prints 'Hello, World!' to the console.",
    difficulty: "Easy",
    category: "Basics",
    inputFormat: "None",
    outputFormat: "A single line containing 'Hello, World!'",
    constraints: "None",
    testCases: [
      { input: "", expectedOutput: "Hello, World!\n" }
    ],
    starterCode: {
      python: "# Write your code here to print 'Hello, World!'\n",
      javascript: "// Write your code here to print 'Hello, World!'\n",
      java: "public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
      c: "#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}",
      cpp: "#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}",
      ruby: "# Your code here\n"
    },
    languages: ["python", "javascript", "java", "c", "cpp", "ruby"],
    tags: ["basics", "introduction"],
    snippets: [
      { title: "Printing in Python", code: "print('Hello, World!')" },
      { title: "Printing in JS", code: "console.log('Hello, World!')" }
    ]
  },
  {
    id: "p2",
    title: "Sum of Two Numbers",
    description: "Read two integers from input and print their sum.",
    difficulty: "Easy",
    category: "Arithmetic",
    inputFormat: "Two integers separated by a space.",
    outputFormat: "The sum of the two integers.",
    constraints: "Integers are between -10^9 and 10^9.",
    testCases: [
      { input: "5 10", expectedOutput: "15\n" },
      { input: "-5 5", expectedOutput: "0\n" }
    ],
    starterCode: {
      python: "import sys\n\ndef solve():\n    # Read from sys.stdin\n    try:\n        line = sys.stdin.read()\n        if not line: return\n        a, b = map(int, line.split())\n        print(a + b)\n    except:\n        pass\n\nif __name__ == '__main__':\n    solve()",
      javascript: "const fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf8');\n    const parts = input.trim().split(/\\s+/);\n    if (parts.length < 2) return;\n    console.log(Number(parts[0]) + Number(parts[1]));\n}\n\nsolve();",
      java: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(a + b);\n        }\n    }\n}",
      c: "#include <stdio.h>\n\nint main() {\n    int a, b;\n    if (scanf(\"%d %d\", &a, &b) == 2) {\n        printf(\"%d\\n\", a + b);\n    }\n    return 0;\n}",
      cpp: "#include <iostream>\n\nint main() {\n    int a, b;\n    if (std::cin >> a >> b) {\n        std::cout << a + b << std::endl;\n    }\n    return 0;\n}",
      ruby: "def solve\n  input = gets\n  if input\n    a, b = input.split.map(&:to_i)\n    puts a + b\n  end\nend\n\nsolve if __FILE__ == $0"
    },
    languages: ["python", "javascript", "java", "c", "cpp", "ruby"],
    tags: ["arithmetic", "math"],
    snippets: [
      { title: "Reading Input (Python)", code: "import sys\nline = sys.stdin.read()\na, b = map(int, line.split())\nprint(a + b)" },
      { title: "Reading Input (JS)", code: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8');\nconst [a, b] = input.trim().split(' ').map(Number);\nconsole.log(a + b);" }
    ]
  },
  {
    id: "p3",
    title: "Palindrome Checker",
    description: "Determine if a given string is a palindrome (reads the same forwards and backwards). Ignore case and non-alphanumeric characters.",
    difficulty: "Easy",
    category: "Strings",
    inputFormat: "A single string.",
    outputFormat: " 'true' if it's a palindrome, 'false' otherwise.",
    constraints: "String length < 1000.",
    testCases: [
      { input: "racecar", expectedOutput: "true\n" },
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true\n" },
      { input: "hello", expectedOutput: "false\n" }
    ],
    starterCode: {
      python: "import sys\nimport re\n\ndef is_palindrome(s):\n    # Your logic here\n    pass\n\nline = sys.stdin.read().strip()\nprint(str(is_palindrome(line)).lower())",
      javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n\nfunction isPalindrome(s) {\n    // Your logic here\n}\n\nconsole.log(isPalindrome(input));",
      java: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(isPalindrome(s));\n    }\n\n    public static boolean isPalindrome(String s) {\n        // Your logic here\n        return false;\n    }\n}",
      c: "#include <stdio.h>\n#include <string.h>\n#include <ctype.h>\n#include <stdbool.h>\n\nbool is_palindrome(char* s) {\n    // Your logic here\n    return false;\n}\n\nint main() {\n    char s[1024];\n    fgets(s, 1024, stdin);\n    printf(\"%s\\n\", is_palindrome(s) ? \"true\" : \"false\");\n    return 0;\n}",
      cpp: "#include <iostream>\n#include <string>\n#include <algorithm>\n\nbool isPalindrome(std::string s) {\n    // Your logic here\n    return false;\n}\n\nint main() {\n    std::string s;\n    std::getline(std::cin, s);\n    std::cout << (isPalindrome(s) ? \"true\" : \"false\") << std::endl;\n    return 0;\n}",
      ruby: "def palindrome?(s)\n  # Your logic here\nend\n\nputs palindrome?(gets.strip)"
    },
    languages: ["python", "javascript", "java", "c", "cpp", "ruby"],
    tags: ["strings", "basics"],
    snippets: [
      { title: "Regex Cleaner (Python)", code: "import re\ns = re.sub(r'[^a-zA-Z0-9]', '', s).lower()" },
      { title: "String Reverse (JS)", code: "s.split('').reverse().join('')" }
    ]
  },
  {
    id: "p4",
    title: "Valid Parentheses",
    description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    difficulty: "Medium",
    category: "Stacks",
    inputFormat: "A single string of brackets.",
    outputFormat: "'true' if valid, 'false' otherwise.",
    constraints: "Length of string <= 10^4.",
    testCases: [
      { input: "()[]{}", expectedOutput: "true\n" },
      { input: "([)]", expectedOutput: "false\n" },
      { input: "{[]}", expectedOutput: "true\n" }
    ],
    starterCode: {
      python: "import sys\n\ndef isValid(s):\n    stack = []\n    # Your logic\n    return True\n\nprint(str(isValid(sys.stdin.read().strip())).lower())",
      javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n// Your logic\nconsole.log(isValid(input));",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(isValid(sc.next()));\n    }\n    public static boolean isValid(String s) {\n        return false;\n    }\n}",
      c: "#include <stdio.h>\n#include <stdbool.h>\nint main() { return 0; }",
      cpp: "#include <iostream>\n#include <stack>\n#include <string>\nint main() { return 0; }",
      ruby: "def is_valid(s); end"
    },
    languages: ["python", "javascript", "java", "c", "cpp", "ruby"],
    tags: ["stacks", "data-structures"],
    snippets: [
      { title: "Stack Push/Pop (Python)", code: "stack.append(char)\nchar = stack.pop()" }
    ]
  },
  {
    id: "p5",
    title: "Maximum Subarray",
    description: "Find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
    difficulty: "Hard",
    category: "Dynamic Programming",
    inputFormat: "A list of integers separated by spaces.",
    outputFormat: "The sum of the maximum subarray.",
    constraints: "Array length <= 10^5.",
    testCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6\n" },
      { input: "1", expectedOutput: "1\n" },
      { input: "5 4 -1 7 8", expectedOutput: "23\n" }
    ],
    starterCode: {
      python: "import sys\ndef maxSubArray(nums):\n    # Kadane's Algorithm\n    pass\n\nnums = list(map(int, sys.stdin.read().split()))\nprint(maxSubArray(nums))",
      javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n// Your logic\nconsole.log(maxSubArray(input));",
      java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read and solve\n    }\n}",
      c: "#include <stdio.h>\nint main() { return 0; }",
      cpp: "#include <iostream>\n#include <vector>\nint main() { return 0; }",
      ruby: "def max_sub_array(nums); end"
    },
    languages: ["python", "javascript", "java", "c", "cpp", "ruby"],
    tags: ["dp", "dynamic-programming", "arrays"],
    snippets: [
      { title: "Kadane's Algorithm", code: "current_sum = max_sum = nums[0]\nfor x in nums[1:]:\n    current_sum = max(x, current_sum + x)\n    max_sum = max(max_sum, current_sum)" }
    ]
  },
  {
    id: "p6",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    difficulty: "Medium",
    category: "Arrays",
    inputFormat: "First line: Target integer. Second line: Array of integers separated by spaces.",
    outputFormat: "Two indices separated by a space.",
    constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9",
    testCases: [
      { input: "9\n2 7 11 15", expectedOutput: "0 1\n" },
      { input: "6\n3 2 4", expectedOutput: "1 2\n" }
    ],
    starterCode: {
      python: "import sys\n\ndef solve():\n    lines = sys.stdin.readlines()\n    target = int(lines[0].strip())\n    nums = list(map(int, lines[1].strip().split()))\n    # Your logic\n\nsolve()",
      javascript: "const fs = require('fs');\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf8').split('\\n');\n    const target = parseInt(input[0]);\n    const nums = input[1].trim().split(/\\s+/).map(Number);\n    // Your logic\n}\nsolve();"
    },
    languages: ["python", "javascript"],
    tags: ["hash-table", "arrays"]
  },
  {
    id: "p7",
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters.",
    difficulty: "Easy",
    category: "Strings",
    inputFormat: "A single line containing a string.",
    outputFormat: "The reversed string.",
    constraints: "1 <= s.length <= 10^5",
    testCases: [
      { input: "hello", expectedOutput: "olleh\n" },
      { input: "Hannah", expectedOutput: "hannaH\n" }
    ],
    starterCode: {
      python: "import sys\ns = sys.stdin.read().strip()\nprint(s[::-1])",
      javascript: "const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconsole.log(s.split('').reverse().join(''));"
    },
    languages: ["python", "javascript"],
    tags: ["strings"]
  },
  {
    id: "p8",
    title: "Binary Search",
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.",
    difficulty: "Easy",
    category: "Algorithms",
    inputFormat: "First line: target. Second line: sorted array separated by spaces.",
    outputFormat: "Index of target or -1.",
    constraints: "1 <= nums.length <= 10^4, nums is sorted.",
    testCases: [
      { input: "9\n-1 0 3 5 9 12", expectedOutput: "4\n" },
      { input: "2\n-1 0 3 5 9 12", expectedOutput: "-1\n" }
    ],
    starterCode: {
      python: "import sys\ndef solve():\n    lines = sys.stdin.readlines()\n    target = int(lines[0].strip())\n    nums = list(map(int, lines[1].split()))\n    # Your logic\nsolve()",
      javascript: "const fs = require('fs');\n// Your logic"
    },
    languages: ["python", "javascript"],
    tags: ["binary-search", "searching"]
  },
  {
    id: "p9",
    title: "Fibonacci Number",
    description: "The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. Given n, calculate F(n).",
    difficulty: "Easy",
    category: "Math",
    inputFormat: "An integer N.",
    outputFormat: "The N-th Fibonacci number.",
    constraints: "0 <= n <= 30",
    testCases: [
      { input: "2", expectedOutput: "1\n" },
      { input: "3", expectedOutput: "2\n" },
      { input: "4", expectedOutput: "3\n" }
    ],
    starterCode: {
      python: "import sys\ndef fib(n):\n    # logic\n    pass\n\nprint(fib(int(sys.stdin.read().strip())))",
      javascript: "const fs = require('fs');\nconst n = parseInt(fs.readFileSync(0, 'utf8').trim());\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["math", "recursion", "dp"]
  },
  {
    id: "p10",
    title: "Palindrome Check",
    description: "Given a string s, return true if it is a palindrome, and false otherwise. A palindrome reads the same backwards as forwards.",
    difficulty: "Easy",
    category: "Strings",
    inputFormat: "A single string S.",
    outputFormat: "true or false.",
    constraints: "1 <= s.length <= 2 * 10^5",
    testCases: [
      { input: "racecar", expectedOutput: "true\n" },
      { input: "hello", expectedOutput: "false\n" }
    ],
    starterCode: {
      python: "import sys\ndef is_palindrome(s):\n    return s == s[::-1]\n\nprint(str(is_palindrome(sys.stdin.read().strip())).lower())",
      javascript: "const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\nconsole.log(s === s.split('').reverse().join(''));"
    },
    languages: ["python", "javascript"],
    tags: ["strings", "basic"]
  },
  {
    id: "p11",
    title: "FizzBuzz",
    description: "Given an integer n, return a string array answer (1-indexed) where:\n- answer[i] == 'FizzBuzz' if i is divisible by 3 and 5.\n- answer[i] == 'Fizz' if i is divisible by 3.\n- answer[i] == 'Buzz' if i is divisible by 5.\n- answer[i] == i (as a string) if none of the above conditions are true.",
    difficulty: "Easy",
    category: "Math",
    inputFormat: "An integer N.",
    outputFormat: "Numbers from 1 to N with FizzBuzz rules, one per line.",
    constraints: "1 <= n <= 10^4",
    testCases: [
      { input: "3", expectedOutput: "1\n2\nFizz\n" },
      { input: "5", expectedOutput: "1\n2\nFizz\n4\nBuzz\n" }
    ],
    starterCode: {
      python: "import sys\nn = int(sys.stdin.read().strip())\nfor i in range(1, n+1):\n    if i % 15 == 0: print('FizzBuzz')\n    elif i % 3 == 0: print('Fizz')\n    elif i % 5 == 0: print('Buzz')\n    else: print(i)",
      javascript: "const fs = require('fs');\nconst n = parseInt(fs.readFileSync(0, 'utf8').trim());\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["math", "logic"]
  },
  {
    id: "p12",
    title: "Valid Parentheses",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.",
    difficulty: "Medium",
    category: "Stack",
    inputFormat: "A string S containing brackets.",
    outputFormat: "true if valid, false otherwise.",
    constraints: "1 <= s.length <= 10^4",
    testCases: [
      { input: "()", expectedOutput: "true\n" },
      { input: "()[]{}", expectedOutput: "true\n" },
      { input: "(]", expectedOutput: "false\n" }
    ],
    starterCode: {
      python: "import sys\ns = sys.stdin.read().strip()\n# logic",
      javascript: "const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["stack", "strings"]
  },
  {
    id: "p13",
    title: "Longest Substring Without Repeating Characters",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    difficulty: "Medium",
    category: "Sliding Window",
    inputFormat: "A string S.",
    outputFormat: "Length of the longest substring.",
    constraints: "0 <= s.length <= 5 * 10^4",
    testCases: [
      { input: "abcabcbb", expectedOutput: "3\n" },
      { input: "bbbbb", expectedOutput: "1\n" },
      { input: "pwwkew", expectedOutput: "3\n" }
    ],
    starterCode: {
      python: "import sys\ns = sys.stdin.read().strip()\n# logic",
      javascript: "const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf8').trim();\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["sliding-window", "strings"]
  },
  {
    id: "p14",
    title: "Median of Two Sorted Arrays",
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
    difficulty: "Hard",
    category: "Arrays",
    inputFormat: "Two lines, each containing space-separated integers for nums1 and nums2.",
    outputFormat: "The median (as a float).",
    constraints: "nums1.length == m, nums2.length == n, 0 <= m, n <= 1000",
    testCases: [
      { input: "1 3\n2", expectedOutput: "2.0\n" },
      { input: "1 2\n3 4", expectedOutput: "2.5\n" }
    ],
    starterCode: {
      python: "import sys\nlines = sys.stdin.read().split('\\n')\nnums1 = [int(x) for x in lines[0].split()]\nnums2 = [int(x) for x in lines[1].split()]\n# logic",
      javascript: "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf8').split('\\n');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["binary-search", "arrays", "hard"]
  },
  {
    id: "p15",
    title: "Merge Two Sorted Lists",
    description: "You are given the heads of two sorted linked lists list1 and list2.\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\nReturn the head of the merged linked list.\nNote: For this platform, lists are represented as arrays.",
    difficulty: "Easy",
    category: "Linked List",
    inputFormat: "Two lines, each containing space-separated integers for list1 and list2.",
    outputFormat: "A single space-separated string of the merged sorted list.",
    constraints: "The number of nodes in both lists is in the range [0, 50]. -100 <= Node.val <= 100",
    testCases: [
      { input: "1 2 4\n1 3 4", expectedOutput: "1 1 2 3 4 4\n" },
      { input: "\n0", expectedOutput: "0\n" }
    ],
    starterCode: {
      python: "import sys\nlines = sys.stdin.read().split('\\n')\n# logic\n# print(' '.join(map(str, sorted_list)))",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["linked-list", "recursion"]
  },
  {
    id: "p16",
    title: "Maximum Depth of Binary Tree",
    description: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.\nInput is represented as Level Order traversal array. (e.g. 3 9 20 null null 15 7)",
    difficulty: "Easy",
    category: "Tree",
    inputFormat: "A space-separated array representing the tree level-order.",
    outputFormat: "An integer representing the depth.",
    constraints: "The number of nodes in the tree is in the range [0, 10^4].",
    testCases: [
      { input: "3 9 20 null null 15 7", expectedOutput: "3\n" },
      { input: "1 null 2", expectedOutput: "2\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["tree", "dfs", "recursion"]
  },
  {
    id: "p17",
    title: "Best Time to Buy and Sell Stock",
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day.\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    difficulty: "Easy",
    category: "Arrays",
    inputFormat: "Space-separated integers representing daily prices.",
    outputFormat: "Max profit (integer).",
    constraints: "1 <= prices.length <= 10^5, 0 <= prices[i] <= 10^4",
    testCases: [
      { input: "7 1 5 3 6 4", expectedOutput: "5\n" },
      { input: "7 6 4 3 1", expectedOutput: "0\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["arrays", "dynamic-programming"]
  },
  {
    id: "p18",
    title: "Missing Number",
    description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.",
    difficulty: "Easy",
    category: "Math",
    inputFormat: "Space-separated integers representing the array.",
    outputFormat: "The missing number.",
    constraints: "n == nums.length, 1 <= n <= 10^4, 0 <= nums[i] <= n. All the numbers of nums are unique.",
    testCases: [
      { input: "3 0 1", expectedOutput: "2\n" },
      { input: "0 1", expectedOutput: "2\n" },
      { input: "9 6 4 2 3 5 7 0 1", expectedOutput: "8\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["math", "bit-manipulation", "arrays"]
  },
  {
    id: "p19",
    title: "Climbing Stairs",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    difficulty: "Easy",
    category: "Dynamic Programming",
    inputFormat: "An integer N.",
    outputFormat: "Number of ways (integer).",
    constraints: "1 <= n <= 45",
    testCases: [
      { input: "2", expectedOutput: "2\n" },
      { input: "3", expectedOutput: "3\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["dynamic-programming", "memoization"]
  },
  {
    id: "p20",
    title: "Validate Binary Search Tree",
    description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).\nInput is level-order array.",
    difficulty: "Medium",
    category: "Tree",
    inputFormat: "Space-separated array representing the tree level-order.",
    outputFormat: "true or false.",
    constraints: "The number of nodes in the tree is in the range [1, 10^4].",
    testCases: [
      { input: "2 1 3", expectedOutput: "true\n" },
      { input: "5 1 4 null null 3 6", expectedOutput: "false\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["tree", "dfs", "binary-search-tree"]
  },
  {
    id: "p21",
    title: "LRU Cache",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\nImplement the LRUCache class:\n- LRUCache(capacity) Initialize the LRU cache with positive size capacity.\n- int get(key) Return the value of the key if the key exists, otherwise return -1.\n- void put(key, value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.\nThe functions get and put must each run in O(1) average time complexity.\nInput format: Commands array and Arguments array.",
    difficulty: "Hard",
    category: "Design",
    inputFormat: "First line: Capacity. Following lines: Command and Arguments.",
    outputFormat: "Results of get operations separated by spaces.",
    constraints: "1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5",
    testCases: [
      { input: "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4", expectedOutput: "1 -1 -1 3 4\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["design", "hash-table", "linked-list"]
  },
  {
    id: "p22",
    title: "Valid Anagram",
    description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    difficulty: "Easy",
    category: "Strings",
    inputFormat: "Two lines, each containing a string.",
    outputFormat: "true or false.",
    constraints: "1 <= s.length, t.length <= 5 * 10^4",
    testCases: [
      { input: "anagram\nnagaram", expectedOutput: "true\n" },
      { input: "rat\ncar", expectedOutput: "false\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["strings", "hash-table", "sorting"]
  },
  {
    id: "p23",
    title: "Reverse Linked List",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.\nInput: Space-separated values of the list.",
    difficulty: "Easy",
    category: "Linked List",
    inputFormat: "Space-separated integers.",
    outputFormat: "Space-separated integers of the reversed list.",
    constraints: "The number of nodes in the list is in the range [0, 5000]. -5000 <= Node.val <= 5000",
    testCases: [
      { input: "1 2 3 4 5", expectedOutput: "5 4 3 2 1\n" },
      { input: "1 2", expectedOutput: "2 1\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["linked-list", "recursion"]
  },
  {
    id: "p24",
    title: "Longest Common Prefix",
    description: "Write a function to find the longest common prefix string amongst an array of strings.\nIf there is no common prefix, return an empty string \"\".",
    difficulty: "Easy",
    category: "Strings",
    inputFormat: "Space-separated strings.",
    outputFormat: "The longest common prefix.",
    constraints: "1 <= strs.length <= 200, 0 <= strs[i].length <= 200",
    testCases: [
      { input: "flower flow flight", expectedOutput: "fl\n" },
      { input: "dog racecar car", expectedOutput: "\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["strings"]
  },
  {
    id: "p25",
    title: "Container With Most Water",
    description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\nReturn the maximum amount of water a container can store.",
    difficulty: "Medium",
    category: "Algorithms",
    inputFormat: "Space-separated integers representing heights.",
    outputFormat: "Maximum area (integer).",
    constraints: "n == height.length, 2 <= n <= 10^5, 0 <= height[i] <= 10^4",
    testCases: [
      { input: "1 8 6 2 5 4 8 3 7", expectedOutput: "49\n" },
      { input: "1 1", expectedOutput: "1\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["two-pointers", "greedy", "arrays"]
  },
  {
    id: "p26",
    title: "3Sum",
    description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\nNotice that the solution set must not contain duplicate triplets.",
    difficulty: "Medium",
    category: "Algorithms",
    inputFormat: "Space-separated integers.",
    outputFormat: "Sorted triplets, each triplet sorted, triplets separated by newlines.",
    constraints: "3 <= nums.length <= 3000, -10^5 <= nums[i] <= 10^5",
    testCases: [
      { input: "-1 0 1 2 -1 -4", expectedOutput: "-1 -1 2\n-1 0 1\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["two-pointers", "sorting", "arrays"]
  },
  {
    id: "p27",
    title: "Jump Game",
    description: "You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\nReturn true if you can reach the last index, or false otherwise.",
    difficulty: "Medium",
    category: "Dynamic Programming",
    inputFormat: "Space-separated integers.",
    outputFormat: "true or false.",
    constraints: "1 <= nums.length <= 10^4, 0 <= nums[i] <= 10^5",
    testCases: [
      { input: "2 3 1 1 4", expectedOutput: "true\n" },
      { input: "3 2 1 0 4", expectedOutput: "false\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["greedy", "dynamic-programming", "arrays"]
  },
  {
    id: "p28",
    title: "Coin Change",
    description: "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.\nYou may assume that you have an infinite number of each kind of coin.",
    difficulty: "Medium",
    category: "Dynamic Programming",
    inputFormat: "First line: space-separated coins. Second line: amount.",
    outputFormat: "Minimum coins (integer).",
    constraints: "1 <= coins.length <= 12, 1 <= coins[i] <= 2^31 - 1, 0 <= amount <= 10^4",
    testCases: [
      { input: "1 2 5\n11", expectedOutput: "3\n" },
      { input: "2\n3", expectedOutput: "-1\n" },
      { input: "1\n0", expectedOutput: "0\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["dynamic-programming", "bfs"]
  },
  {
    id: "p29",
    title: "Word Ladder",
    description: "A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words beginWord -> s1 -> s2 -> ... -> sk such that:\n- Every adjacent pair of words differs by a single letter.\n- Every si for 1 <= i <= k is in wordList. Note that beginWord does not need to be in wordList.\n- sk == endWord\nGiven two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord, or 0 if no such sequence exists.",
    difficulty: "Hard",
    category: "Algorithms",
    inputFormat: "First line: beginWord endWord. Second line: space-separated wordList.",
    outputFormat: "Shortest sequence length (integer).",
    constraints: "1 <= beginWord.length <= 10, endWord.length == beginWord.length, 1 <= wordList.length <= 5000",
    testCases: [
      { input: "hit cog\nhot dot dog lot log cog", expectedOutput: "5\n" },
      { input: "hit cog\nhot dot dog lot log", expectedOutput: "0\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["bfs", "graph", "hash-table"]
  },
  {
    id: "p30",
    title: "Trapping Rain Water",
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    difficulty: "Hard",
    category: "Algorithms",
    inputFormat: "Space-separated integers.",
    outputFormat: "Total water trapped (integer).",
    constraints: "n == height.length, 1 <= n <= 2 * 10^4, 0 <= height[i] <= 10^5",
    testCases: [
      { input: "0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6\n" },
      { input: "4 2 0 3 2 5", expectedOutput: "9\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["two-pointers", "stack", "dynamic-programming"]
  },
  {
    id: "p31",
    title: "Binary Tree Maximum Path Sum",
    description: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.\nThe path sum of a path is the sum of the node's values in the path.\nGiven the root of a binary tree, return the maximum path sum of any non-empty path.\nInput: Level-order array.",
    difficulty: "Hard",
    category: "Tree",
    inputFormat: "Space-separated integers (level-order).",
    outputFormat: "Maximum path sum (integer).",
    constraints: "The number of nodes in the tree is in the range [1, 3 * 10^4]. -1000 <= Node.val <= 1000",
    testCases: [
      { input: "1 2 3", expectedOutput: "6\n" },
      { input: "-10 9 20 null null 15 7", expectedOutput: "42\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["tree", "dfs", "recursion"]
  },
  {
    id: "p32",
    title: "Edit Distance",
    description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\nYou have the following three operations permitted on a word:\n- Insert a character\n- Delete a character\n- Replace a character",
    difficulty: "Hard",
    category: "Dynamic Programming",
    inputFormat: "Two lines, each containing a string.",
    outputFormat: "Minimum operations (integer).",
    constraints: "0 <= word1.length, word2.length <= 500",
    testCases: [
      { input: "horse\nros", expectedOutput: "3\n" },
      { input: "intention\nexecution", expectedOutput: "5\n" }
    ],
    starterCode: {
      python: "import sys\n# logic",
      javascript: "const fs = require('fs');\n// logic"
    },
    languages: ["python", "javascript"],
    tags: ["dynamic-programming", "strings"]
  }
];
