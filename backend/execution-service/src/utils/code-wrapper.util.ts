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

    # Print result as compact JSON to match the test-case convention
    # (strings quoted, arrays without spaces, booleans lowercase)
    if isinstance(result, bool):
        print(str(result).lower())
    elif isinstance(result, (list, dict, str)):
        print(json.dumps(result, separators=(',', ':')))
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
    } else if (typeof result === 'object' || typeof result === 'string') {
        // JSON to match the test-case convention (strings are quoted)
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
   * Wrap C code with I/O handling.
   *
   * Supports the LeetCode-style C signatures used by the problem library:
   * - scalars: int, long, long long, float, double, bool, char* (string)
   * - int arrays (`int* nums, int numsSize` — the Size param is derived from
   *   the parsed array, not a separate input line)
   * - string arrays (`char** strs, int strsSize`)
   * - int matrices (`int** grid, int gridSize, int* gridColSize`)
   * - out-params `int* returnSize` / `int** returnColumnSizes` for functions
   *   returning arrays/matrices
   * - returns: void (prints the first mutated array/matrix/string param),
   *   scalars, char*, int* / int** / char** / char*** via the out-params
   *
   * Input lines are JSON values (one per input param), matching the Python
   * and JavaScript wrappers. An input consisting of a single JSON object
   * (e.g. {"nums1": [...], "m": 3, ...}) is bound to parameters by key.
   * Output follows the shared convention: bools lowercase, doubles %.5f,
   * strings JSON-quoted, arrays compact.
   */
  private static wrapC(code: string): string {
    const functionMatch = code.match(/([\w]+(?:\s+[\w]+)*[\s\*]+)(\w+)\s*\(([^)]*)\)/);
    if (!functionMatch) {
      return code;
    }

    const rawReturn = functionMatch[1].replace(/\s+/g, ' ').trim();
    const functionName = functionMatch[2];
    const params = functionMatch[3];

    if (/\b(ListNode|TreeNode|Node)\b/.test(code.slice(0, code.indexOf(functionName) + 400))) {
      return `#error CodeSphere: linked-list/tree problems are not yet supported by the C harness\n${code}`;
    }

    interface CParam {
      base: string; // e.g. 'int', 'char', 'double', 'long long'
      stars: number;
      name: string;
      kind:
        | 'UNSET'
        | 'INT' | 'DOUBLE' | 'BOOL' | 'STRING'
        | 'INT_ARRAY' | 'STR_ARRAY' | 'INT_MATRIX'
        | 'DERIVED_SIZE' | 'DERIVED_COLS' | 'OUT_SIZE' | 'OUT_COLS';
      of?: string; // for DERIVED_*: the array/matrix param it belongs to
    }

    const parsed: CParam[] = params
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const stars = (p.match(/\*/g) || []).length;
        const tokens = p.replace(/\*/g, ' ').split(/\s+/).filter(Boolean);
        const name = tokens[tokens.length - 1];
        const base = tokens
          .slice(0, -1)
          .filter((t) => t !== 'const' && t !== 'unsigned' && t !== 'signed')
          .join(' ');
        return { base, stars, name, kind: 'UNSET' as CParam['kind'] };
      });

    const byName = new Map(parsed.map((p) => [p.name, p]));
    const unsupported: string[] = [];

    // Pass 1: out-params and array/matrix params claim their derived
    // size/colSize partners, so the scalar pass below never reclassifies them.
    for (const p of parsed) {
      if (p.kind !== 'UNSET') continue;
      const sizeParam = byName.get(`${p.name}Size`);
      const colsParam = byName.get(`${p.name}ColSize`);
      if (p.name === 'returnSize' && p.base === 'int' && p.stars === 1) {
        p.kind = 'OUT_SIZE';
      } else if (p.name === 'returnColumnSizes' && p.base === 'int' && p.stars === 2) {
        p.kind = 'OUT_COLS';
      } else if (p.base === 'int' && p.stars === 2 && sizeParam && colsParam) {
        p.kind = 'INT_MATRIX';
        sizeParam.kind = 'DERIVED_SIZE';
        sizeParam.of = p.name;
        colsParam.kind = 'DERIVED_COLS';
        colsParam.of = p.name;
      } else if (p.base === 'int' && p.stars === 1 && sizeParam) {
        p.kind = 'INT_ARRAY';
        sizeParam.kind = 'DERIVED_SIZE';
        sizeParam.of = p.name;
      } else if (p.base === 'char' && p.stars === 2 && sizeParam) {
        p.kind = 'STR_ARRAY';
        sizeParam.kind = 'DERIVED_SIZE';
        sizeParam.of = p.name;
      }
    }

    // Pass 2: remaining params are scalars/strings — or unsupported.
    for (const p of parsed) {
      if (p.kind !== 'UNSET') continue;
      if (p.base === 'char' && p.stars === 1) {
        p.kind = 'STRING';
      } else if (p.stars === 0 && ['int', 'long', 'long long', 'short'].includes(p.base)) {
        p.kind = 'INT';
      } else if (p.stars === 0 && ['double', 'float'].includes(p.base)) {
        p.kind = 'DOUBLE';
      } else if (p.stars === 0 && p.base === 'bool') {
        p.kind = 'BOOL';
      } else {
        unsupported.push(`${p.base}${'*'.repeat(p.stars)} ${p.name}`);
      }
    }

    const RETURN_KINDS: Record<string, string> = {
      'void': 'VOID',
      'int': 'INT', 'long': 'INT', 'long long': 'INT', 'short': 'INT',
      'double': 'DOUBLE', 'float': 'DOUBLE',
      'bool': 'BOOL',
      'char *': 'STRING', 'char*': 'STRING',
      'int *': 'INT_ARRAY', 'int*': 'INT_ARRAY',
      'int **': 'INT_MATRIX', 'int**': 'INT_MATRIX',
      'char **': 'STR_ARRAY', 'char**': 'STR_ARRAY',
      'char ***': 'STR_MATRIX', 'char***': 'STR_MATRIX',
    };
    const returnKind = RETURN_KINDS[rawReturn.replace(/\s*\*/g, '*')] ?? RETURN_KINDS[rawReturn];

    const hasOutSize = parsed.some((p) => p.kind === 'OUT_SIZE');
    const hasOutCols = parsed.some((p) => p.kind === 'OUT_COLS');
    if (!returnKind) unsupported.push(`return type '${rawReturn}'`);
    if ((returnKind === 'INT_ARRAY' || returnKind === 'STR_ARRAY') && !hasOutSize)
      unsupported.push(`return type '${rawReturn}' without an int* returnSize param`);
    if ((returnKind === 'INT_MATRIX' || returnKind === 'STR_MATRIX') && (!hasOutSize || !hasOutCols))
      unsupported.push(`return type '${rawReturn}' without returnSize/returnColumnSizes params`);

    if (unsupported.length > 0) {
      return `#error CodeSphere C harness: unsupported signature part(s): ${unsupported.join('; ').replace(/"/g, "'")}\n${code}`;
    }

    // One input line (or object key) per non-derived, non-out param.
    const inputParams = parsed.filter(
      (p) => !['DERIVED_SIZE', 'DERIVED_COLS', 'OUT_SIZE', 'OUT_COLS'].includes(p.kind),
    );

    const declarations = inputParams
      .map((p, idx) => {
        const src = `cs_value_for(${idx}, "${p.name}")`;
        switch (p.kind) {
          case 'INT':
            return `    ${p.base} ${p.name} = (${p.base})cs_parse_i64(${src});`;
          case 'DOUBLE':
            return `    ${p.base} ${p.name} = (${p.base})cs_parse_dbl(${src});`;
          case 'BOOL':
            return `    bool ${p.name} = cs_parse_bool(${src});`;
          case 'STRING':
            return `    char* ${p.name} = cs_parse_str(${src});`;
          case 'INT_ARRAY':
            return `    int ${p.name}Size = 0;\n    int* ${p.name} = cs_parse_int_array(${src}, &${p.name}Size);`;
          case 'STR_ARRAY':
            return `    int ${p.name}Size = 0;\n    char** ${p.name} = cs_parse_str_array(${src}, &${p.name}Size);`;
          case 'INT_MATRIX':
            return `    int ${p.name}Size = 0;\n    int* ${p.name}ColSize = NULL;\n    int** ${p.name} = cs_parse_int_matrix(${src}, &${p.name}Size, &${p.name}ColSize);`;
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n');

    const callArgs = parsed
      .map((p) => {
        switch (p.kind) {
          case 'OUT_SIZE': return '&cs_returnSize';
          case 'OUT_COLS': return '&cs_returnColumnSizes';
          case 'DERIVED_SIZE': return `${p.of}Size`;
          case 'DERIVED_COLS': return `${p.of}ColSize`;
          default: return p.name;
        }
      })
      .join(', ');

    let invokeAndPrint: string;
    switch (returnKind) {
      case 'VOID': {
        const mutated = inputParams.find((p) =>
          ['INT_ARRAY', 'INT_MATRIX', 'STRING', 'STR_ARRAY'].includes(p.kind),
        );
        let printMutated = '';
        if (mutated?.kind === 'INT_ARRAY') printMutated = `cs_print_int_array(${mutated.name}, ${mutated.name}Size);`;
        else if (mutated?.kind === 'INT_MATRIX') printMutated = `cs_print_int_matrix(${mutated.name}, ${mutated.name}Size, ${mutated.name}ColSize);`;
        else if (mutated?.kind === 'STRING') printMutated = `cs_print_str(${mutated.name});`;
        else if (mutated?.kind === 'STR_ARRAY') printMutated = `cs_print_str_array(${mutated.name}, ${mutated.name}Size);`;
        invokeAndPrint = `    ${functionName}(${callArgs});\n    ${printMutated}`;
        break;
      }
      case 'INT':
        invokeAndPrint = `    long long cs_result = (long long)${functionName}(${callArgs});\n    printf("%lld\\n", cs_result);`;
        break;
      case 'DOUBLE':
        invokeAndPrint = `    double cs_result = (double)${functionName}(${callArgs});\n    printf("%.5f\\n", cs_result);`;
        break;
      case 'BOOL':
        invokeAndPrint = `    bool cs_result = ${functionName}(${callArgs});\n    printf("%s\\n", cs_result ? "true" : "false");`;
        break;
      case 'STRING':
        invokeAndPrint = `    char* cs_result = ${functionName}(${callArgs});\n    cs_print_str(cs_result);`;
        break;
      case 'INT_ARRAY':
        invokeAndPrint = `    int* cs_result = ${functionName}(${callArgs});\n    cs_print_int_array(cs_result, cs_returnSize);`;
        break;
      case 'INT_MATRIX':
        invokeAndPrint = `    int** cs_result = ${functionName}(${callArgs});\n    cs_print_int_matrix(cs_result, cs_returnSize, cs_returnColumnSizes);`;
        break;
      case 'STR_ARRAY':
        invokeAndPrint = `    char** cs_result = ${functionName}(${callArgs});\n    cs_print_str_array(cs_result, cs_returnSize);`;
        break;
      case 'STR_MATRIX':
        invokeAndPrint = `    char*** cs_result = ${functionName}(${callArgs});\n    cs_print_str_matrix(cs_result, cs_returnSize, cs_returnColumnSizes);`;
        break;
      default:
        invokeAndPrint = `    ${functionName}(${callArgs});`;
    }

    // Strip #include statements from user code to avoid duplicates
    const cleanedCode = code.replace(/^#include\s+[<"].*[>"]\s*$/gm, '').trim();

    return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>

/* ---- CodeSphere C harness: JSON-ish input parsing + printing ---------- */

static char* cs_input = NULL;      /* whole input buffer */
static char* cs_lines[64];         /* non-empty line starts (line mode) */
static int cs_line_count = 0;
static bool cs_object_mode = false;
static int cs_returnSize = 0;
static int* cs_returnColumnSizes = NULL;

static void cs_read_input(void) {
  FILE* f = fopen("/app/input.txt", "r");
  if (!f) f = stdin;
  size_t cap = 1 << 16, len = 0;
  cs_input = (char*)malloc(cap);
  size_t n;
  while ((n = fread(cs_input + len, 1, cap - len - 1, f)) > 0) {
    len += n;
    if (len + 1 >= cap) { cap *= 2; cs_input = (char*)realloc(cs_input, cap); }
  }
  cs_input[len] = '\\0';
  if (f != stdin) fclose(f);

  const char* q = cs_input;
  while (*q && isspace((unsigned char)*q)) q++;
  cs_object_mode = (*q == '{');
  if (cs_object_mode) return;

  /* Split into non-empty, NUL-terminated lines. */
  char* save = cs_input;
  char* line = save;
  for (char* c = cs_input; ; c++) {
    if (*c == '\\n' || *c == '\\0') {
      bool end = (*c == '\\0');
      *c = '\\0';
      /* trim trailing \\r / spaces */
      char* e = c;
      while (e > line && (e[-1] == '\\r' || e[-1] == ' ')) *--e = '\\0';
      if (*line && cs_line_count < 64) cs_lines[cs_line_count++] = line;
      if (end) break;
      line = c + 1;
    }
  }
  (void)save;
}

/* In object mode: pointer to the value of "key"; in line mode: line idx. */
static const char* cs_value_for(int idx, const char* key) {
  if (!cs_object_mode) return idx < cs_line_count ? cs_lines[idx] : "";
  size_t klen = strlen(key);
  const char* p = cs_input;
  while ((p = strchr(p, '"')) != NULL) {
    if (strncmp(p + 1, key, klen) == 0 && p[1 + klen] == '"') {
      const char* v = p + klen + 2;
      while (*v && *v != ':') v++;
      if (*v == ':') v++;
      while (*v && isspace((unsigned char)*v)) v++;
      return v;
    }
    p++;
  }
  return "";
}

static void cs_skip_ws(const char** p) { while (**p && isspace((unsigned char)**p)) (*p)++; }

static long long cs_parse_i64(const char* p) { return strtoll(p, NULL, 10); }
static double cs_parse_dbl(const char* p) { return strtod(p, NULL); }
static bool cs_parse_bool(const char* p) {
  while (*p && isspace((unsigned char)*p)) p++;
  return strncmp(p, "true", 4) == 0 || *p == '1';
}

/* Quoted JSON string -> malloc'd C string (handles \\" \\\\ \\n \\t). Raw
 * (unquoted) input falls back to the rest of the value/line. */
static char* cs_parse_str(const char* p) {
  while (*p && isspace((unsigned char)*p)) p++;
  size_t cap = strlen(p) + 1;
  char* out = (char*)malloc(cap);
  size_t o = 0;
  if (*p == '"') {
    p++;
    while (*p && *p != '"') {
      if (*p == '\\\\' && p[1]) {
        p++;
        if (*p == 'n') out[o++] = '\\n';
        else if (*p == 't') out[o++] = '\\t';
        else out[o++] = *p;
        p++;
      } else out[o++] = *p++;
    }
  } else {
    while (*p && *p != '\\n') out[o++] = *p++;
    while (o > 0 && (out[o-1] == ' ' || out[o-1] == '\\r')) o--;
  }
  out[o] = '\\0';
  return out;
}

static int* cs_parse_int_array(const char* p, int* outSize) {
  int cap = 8, n = 0;
  int* arr = (int*)malloc(cap * sizeof(int));
  cs_skip_ws(&p);
  if (*p == '[') p++;
  for (;;) {
    cs_skip_ws(&p);
    if (*p == ']' || *p == '\\0') break;
    char* end;
    long v = strtol(p, &end, 10);
    if (end == p) break;
    if (n == cap) { cap *= 2; arr = (int*)realloc(arr, cap * sizeof(int)); }
    arr[n++] = (int)v;
    p = end;
    cs_skip_ws(&p);
    if (*p == ',') p++;
  }
  *outSize = n;
  return arr;
}

static char** cs_parse_str_array(const char* p, int* outSize) {
  int cap = 8, n = 0;
  char** arr = (char**)malloc(cap * sizeof(char*));
  cs_skip_ws(&p);
  if (*p == '[') p++;
  for (;;) {
    cs_skip_ws(&p);
    if (*p == ']' || *p == '\\0') break;
    if (*p != '"') break;
    /* find end of this quoted item to bound cs_parse_str */
    arr[n] = cs_parse_str(p);
    if (n + 1 == cap) { cap *= 2; arr = (char**)realloc(arr, cap * sizeof(char*)); }
    n++;
    p++; /* past opening quote */
    while (*p && *p != '"') { if (*p == '\\\\' && p[1]) p++; p++; }
    if (*p == '"') p++;
    cs_skip_ws(&p);
    if (*p == ',') p++;
  }
  *outSize = n;
  return arr;
}

static int** cs_parse_int_matrix(const char* p, int* outRows, int** outColSizes) {
  int cap = 8, rows = 0;
  int** m = (int**)malloc(cap * sizeof(int*));
  int* cols = (int*)malloc(cap * sizeof(int));
  cs_skip_ws(&p);
  if (*p == '[') p++;
  for (;;) {
    cs_skip_ws(&p);
    if (*p == ']' || *p == '\\0') break;
    if (*p != '[') break;
    int size = 0;
    m[rows] = cs_parse_int_array(p, &size);
    cols[rows] = size;
    rows++;
    if (rows == cap) {
      cap *= 2;
      m = (int**)realloc(m, cap * sizeof(int*));
      cols = (int*)realloc(cols, cap * sizeof(int));
    }
    /* advance past this inner array */
    int depth = 0;
    do {
      if (*p == '[') depth++;
      else if (*p == ']') depth--;
      p++;
    } while (*p && depth > 0);
    cs_skip_ws(&p);
    if (*p == ',') p++;
  }
  *outRows = rows;
  *outColSizes = cols;
  return m;
}

static void cs_print_str(const char* s) {
  putchar('"');
  for (; s && *s; s++) {
    if (*s == '"' || *s == '\\\\') putchar('\\\\');
    putchar(*s);
  }
  printf("\\"\\n");
}

static void cs_print_str_inline(const char* s) {
  putchar('"');
  for (; s && *s; s++) {
    if (*s == '"' || *s == '\\\\') putchar('\\\\');
    putchar(*s);
  }
  putchar('"');
}

static void cs_print_int_array(const int* a, int n) {
  putchar('[');
  for (int i = 0; i < n; i++) { if (i) putchar(','); printf("%d", a[i]); }
  printf("]\\n");
}

static void cs_print_int_matrix(int** m, int rows, const int* cols) {
  putchar('[');
  for (int r = 0; r < rows; r++) {
    if (r) putchar(',');
    putchar('[');
    for (int c = 0; c < cols[r]; c++) { if (c) putchar(','); printf("%d", m[r][c]); }
    putchar(']');
  }
  printf("]\\n");
}

static void cs_print_str_array(char** a, int n) {
  putchar('[');
  for (int i = 0; i < n; i++) { if (i) putchar(','); cs_print_str_inline(a[i]); }
  printf("]\\n");
}

static void cs_print_str_matrix(char*** m, int rows, const int* cols) {
  putchar('[');
  for (int r = 0; r < rows; r++) {
    if (r) putchar(',');
    putchar('[');
    for (int c = 0; c < cols[r]; c++) { if (c) putchar(','); cs_print_str_inline(m[r][c]); }
    putchar(']');
  }
  printf("]\\n");
}

/* ---- user code -------------------------------------------------------- */

${cleanedCode}

/* ---- harness entry ---------------------------------------------------- */

int main() {
    cs_read_input();

${declarations}

${invokeAndPrint}

    return 0;
}
`;
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
        defer file.Close()
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

    // Print as compact JSON to match the test-case convention
    // (strings quoted, arrays without spaces, booleans lowercase).
    out, _ := json.Marshal(result)
    fmt.Println(string(out))
}
`;

    return wrapper;
  }
}
