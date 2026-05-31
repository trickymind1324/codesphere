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
        return this.wrapCpp(code);
      case ProgrammingLanguage.C:
        return this.wrapC(code);
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
    import os

    # Read input from file if it exists, otherwise from stdin
    if os.path.exists('/app/input.txt'):
        with open('/app/input.txt', 'r') as f:
            lines = [line.strip() for line in f.readlines()]
    else:
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
const fs = require('fs');

// Read input from file if it exists, otherwise from stdin
let lines = [];
if (fs.existsSync('/app/input.txt')) {
    const content = fs.readFileSync('/app/input.txt', 'utf-8');
    lines = content.split('\\n').map(line => line.trim()).filter(line => line);
    processInput();
} else {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    rl.on('line', (line) => {
        lines.push(line.trim());
    });

    rl.on('close', () => {
        processInput();
    });
}

function processInput() {
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
}
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
import java.nio.file.*;

public class Solution {
${code}

    public static void main(String[] args) {
        List<String> lines = new ArrayList<>();

        try {
            // Read from file if it exists, otherwise from stdin
            File inputFile = new File("/app/input.txt");
            if (inputFile.exists()) {
                lines = Files.readAllLines(Paths.get("/app/input.txt"));
                // Remove empty lines
                lines.removeIf(String::isEmpty);
            } else {
                Scanner scanner = new Scanner(System.in);
                while (scanner.hasNextLine()) {
                    String line = scanner.nextLine().trim();
                    if (!line.isEmpty()) {
                        lines.add(line);
                    }
                }
                scanner.close();
            }
        } catch (IOException e) {
            e.printStackTrace();
            System.exit(1);
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
#include <fstream>
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

    // Read from file if it exists, otherwise from stdin
    ifstream inputFile("/app/input.txt");
    if (inputFile.is_open()) {
        while (getline(inputFile, line)) {
            if (!line.empty()) {
                lines.push_back(line);
            }
        }
        inputFile.close();
    } else {
        while (getline(cin, line)) {
            lines.push_back(line);
        }
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
   * Wrap C code with I/O handling
   */
  private static wrapC(code: string): string {
    const functionMatch = code.match(/(\w+)\s+(\w+)\s*\((.*?)\)/);

    if (!functionMatch) {
      return code;
    }

    const [, returnType, functionName, params] = functionMatch;
    const paramList = params.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      // C uses char* for strings
      return { type: parts[0] + (parts[0] === 'char' && parts[1]?.startsWith('*') ? '*' : ''), name: parts[parts.length - 1].replace('*', '') };
    }).filter(p => p.name);

    // Strip #include statements from user code to avoid duplicates
    const cleanedCode = code.replace(/^#include\s+[<"].*[>"]\s*$/gm, '').trim();

    const wrapper = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

void parseString(const char* input, char* output, size_t maxLen) {
    size_t len = strlen(input);
    if (len >= 2 && input[0] == '"' && input[len-1] == '"') {
        strncpy(output, input + 1, len - 2);
        output[len - 2] = '\\0';
    } else {
        strncpy(output, input, maxLen - 1);
        output[maxLen - 1] = '\\0';
    }
}

${cleanedCode}

int main() {
    FILE* inputFile = fopen("/app/input.txt", "r");
    char lines[10][1024];
    int lineCount = 0;

    if (inputFile != NULL) {
        while (fgets(lines[lineCount], sizeof(lines[lineCount]), inputFile) != NULL && lineCount < 10) {
            // Remove newline
            lines[lineCount][strcspn(lines[lineCount], "\\n")] = 0;
            if (strlen(lines[lineCount]) > 0) {
                lineCount++;
            }
        }
        fclose(inputFile);
    } else {
        while (fgets(lines[lineCount], sizeof(lines[lineCount]), stdin) != NULL && lineCount < 10) {
            lines[lineCount][strcspn(lines[lineCount], "\\n")] = 0;
            if (strlen(lines[lineCount]) > 0) {
                lineCount++;
            }
        }
    }

${paramList.map((param, idx) => {
  if (param.type === 'char*') {
    return `    char ${param.name}_buffer[1024];
    if (${idx} < lineCount) {
        parseString(lines[${idx}], ${param.name}_buffer, sizeof(${param.name}_buffer));
    } else {
        ${param.name}_buffer[0] = '\\0';
    }
    char* ${param.name} = ${param.name}_buffer;`;
  } else if (param.type === 'int') {
    return `    int ${param.name} = ${idx} < lineCount ? atoi(lines[${idx}]) : 0;`;
  } else {
    return `    // TODO: Handle ${param.type} ${param.name}`;
  }
}).join('\n')}

    ${returnType === 'bool' ? 'bool' : returnType} result = ${functionName}(${paramList.map(p => p.name).join(', ')});

    if (strcmp("${returnType}", "bool") == 0) {
        printf("%s\\n", result ? "true" : "false");
    } else {
        printf("%d\\n", result);
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
    var lines []string

    // Read from file if it exists, otherwise from stdin
    if file, err := os.Open("/app/input.txt"); err == nil {
        defer file.close()
        scanner := bufio.NewScanner(file)
        for scanner.Scan() {
            line := strings.TrimSpace(scanner.Text())
            if line != "" {
                lines = append(lines, line)
            }
        }
    } else {
        scanner := bufio.NewScanner(os.Stdin)
        for scanner.Scan() {
            line := strings.TrimSpace(scanner.Text())
            if line != "" {
                lines = append(lines, line)
            }
        }
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
