import { ProgrammingLanguage } from '../dto/execute-code.dto';

/**
 * Utility to wrap user code with I/O handling for function-based problems
 */
export class CodeWrapper {
  /**
   * Wrap user code with stdin/stdout handling
   * Extracts function signature and generates appropriate wrapper
   */
  static wrap(code: string, language: ProgrammingLanguage): string {
    switch (language) {
      case ProgrammingLanguage.PYTHON:
        return this.wrapPython(code);
      case ProgrammingLanguage.JAVASCRIPT:
        return this.wrapJavaScript(code);
      case ProgrammingLanguage.TYPESCRIPT:
        return this.wrapTypeScript(code);
      case ProgrammingLanguage.JAVA:
        return this.wrapJava(code);
      case ProgrammingLanguage.CPP:
      case ProgrammingLanguage.C:
        return this.wrapCpp(code);
      case ProgrammingLanguage.GO:
        return this.wrapGo(code);
      default:
        return code;
    }
  }

  /**
   * Wrap Python code with I/O handling
   * Supports function definitions and reads stdin for inputs
   */
  private static wrapPython(code: string): string {
    // Extract function name and parameters
    const functionMatch = code.match(/def\s+(\w+)\s*\((.*?)\):/);

    if (!functionMatch) {
      // No function definition found, assume code handles I/O itself
      return code;
    }

    const [, functionName, params] = functionMatch;
    const paramList = params.split(',').map(p => p.trim().split(':')[0].trim()).filter(p => p);

    // Generate wrapper code
    const wrapper = `
${code}

if __name__ == "__main__":
    import sys
    import json

    # Read all input lines at once
    lines = [line.strip() for line in sys.stdin.readlines()]

    # Parse parameters from JSON
    args = []
    for i in range(${paramList.length}):
        if i < len(lines) and lines[i]:
            try:
                args.append(json.loads(lines[i]))
            except json.JSONDecodeError:
                args.append(lines[i])
        else:
            args.append(None)

    # Call function
    result = ${functionName}(*args)

    # Print result (convert boolean to lowercase string for consistency)
    if isinstance(result, bool):
        print(str(result).lower())
    elif isinstance(result, list):
        print(json.dumps(result))
    elif isinstance(result, dict):
        print(json.dumps(result))
    else:
        print(result)
`;

    return wrapper;
  }

  /**
   * Wrap JavaScript code with I/O handling
   */
  private static wrapJavaScript(code: string): string {
    const functionMatch = code.match(/function\s+(\w+)\s*\((.*?)\)/);

    if (!functionMatch) {
      return code;
    }

    const [, functionName, params] = functionMatch;
    const paramList = params.split(',').map(p => p.trim()).filter(p => p);

    const wrapper = `
${code}

// Auto-generated I/O wrapper
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const lines = [];
rl.on('line', (line) => {
    lines.push(line.trim());
});

rl.on('close', () => {
    // Parse parameters from JSON
    const args = [];
    for (let i = 0; i < ${paramList.length}; i++) {
        if (i < lines.length && lines[i]) {
            try {
                args.push(JSON.parse(lines[i]));
            } catch (e) {
                args.push(lines[i]);
            }
        } else {
            args.push(null);
        }
    }

    const result = ${functionName}(...args);

    if (typeof result === 'boolean') {
        console.log(result.toString());
    } else if (typeof result === 'object') {
        console.log(JSON.stringify(result));
    } else {
        console.log(result);
    }
});
`;

    return wrapper;
  }

  /**
   * Wrap TypeScript code with I/O handling
   */
  private static wrapTypeScript(code: string): string {
    // TypeScript wrapping is similar to JavaScript
    return this.wrapJavaScript(code);
  }

  /**
   * Wrap Java code with I/O handling
   */
  private static wrapJava(code: string): string {
    // Extract method signature
    const methodMatch = code.match(/public\s+(\w+)\s+(\w+)\s*\((.*?)\)/);

    if (!methodMatch) {
      return code;
    }

    const [, returnType, methodName, params] = methodMatch;
    const paramList = params.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      return { type: parts[0], name: parts[1] };
    }).filter(p => p.name);

    // Generate main method wrapper
    const wrapper = `
import java.util.*;
import java.io.*;

public class Solution {
${code}

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        List<String> lines = new ArrayList<>();

        while (scanner.hasNextLine()) {
            lines.add(scanner.nextLine().trim());
        }

        Solution solution = new Solution();

        // Parse parameters from JSON-style input
${paramList.map((param, idx) => {
  if (param.type === 'String') {
    return `        String ${param.name} = ${idx} < lines.size() ? parseString(lines.get(${idx})) : "";`;
  } else {
    return `        ${param.type} ${param.name} = ${idx} < lines.size() ? ${param.type}.valueOf(lines.get(${idx})) : null;`;
  }
}).join('\n')}

        // Call method
        ${returnType} result = solution.${methodName}(${paramList.map(p => p.name).join(', ')});

        // Print result
        if (result instanceof Boolean) {
            System.out.println(result.toString().toLowerCase());
        } else {
            System.out.println(result);
        }

        scanner.close();
    }

    private static String parseString(String input) {
        if (input.startsWith("\\"") && input.endsWith("\\"")) {
            return input.substring(1, input.length() - 1);
        }
        return input;
    }
}
`;

    return wrapper;
  }

  /**
   * Wrap C++ code with I/O handling
   */
  private static wrapCpp(code: string): string {
    // For C++, assume function signature and add main
    const functionMatch = code.match(/(\w+)\s+(\w+)\s*\((.*?)\)/);

    if (!functionMatch) {
      return code;
    }

    const [, returnType, functionName, params] = functionMatch;
    const paramList = params.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      return { type: parts[0], name: parts[1] };
    }).filter(p => p.name);

    const wrapper = `
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string parseString(string input) {
    if (input.length() >= 2 && input[0] == '"' && input[input.length()-1] == '"') {
        return input.substr(1, input.length() - 2);
    }
    return input;
}

${code}

int main() {
    vector<string> lines;
    string line;

    while (getline(cin, line)) {
        lines.push_back(line);
    }

${paramList.map((param, idx) => {
  if (param.type === 'string') {
    return `    string ${param.name} = ${idx} < lines.size() ? parseString(lines[${idx}]) : "";`;
  } else {
    return `    auto ${param.name} = ${idx} < lines.size() ? lines[${idx}] : "";`;
  }
}).join('\n')}

    auto result = ${functionName}(${paramList.map(p => p.name).join(', ')});

    if (typeid(result) == typeid(bool)) {
        cout << (result ? "true" : "false") << endl;
    } else {
        cout << result << endl;
    }

    return 0;
}
`;

    return wrapper;
  }

  /**
   * Wrap Go code with I/O handling
   */
  private static wrapGo(code: string): string {
    const functionMatch = code.match(/func\s+(\w+)\s*\((.*?)\)\s*(\w+)?/);

    if (!functionMatch) {
      return code;
    }

    const [, functionName, params] = functionMatch;
    const paramList = params.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      return { name: parts[0], type: parts[1] };
    }).filter(p => p.name);

    const wrapper = `
package main

import (
    "bufio"
    "encoding/json"
    "fmt"
    "os"
    "strings"
)

${code}

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    var lines []string

    for scanner.Scan() {
        lines = append(lines, strings.TrimSpace(scanner.Text()))
    }

${paramList.map((param, idx) => {
  if (param.type === 'string') {
    return `    var ${param.name} string
    if ${idx} < len(lines) {
        json.Unmarshal([]byte(lines[${idx}]), &${param.name})
    }`;
  } else {
    return `    var ${param.name} ${param.type}
    if ${idx} < len(lines) {
        json.Unmarshal([]byte(lines[${idx}]), &${param.name})
    }`;
  }
}).join('\n')}

    result := ${functionName}(${paramList.map(p => p.name).join(', ')})

    fmt.Println(result)
}
`;

    return wrapper;
  }
}
