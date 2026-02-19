/**
 * JSONata syntax highlighting for CodeMirror 6.
 * Uses StreamLanguage with a simple tokenizer.
 *
 * Token types:
 * - keyword: true, false, null, and, or, in
 * - variableName: $identifier
 * - string: "..." or '...'
 * - number: 42, 3.14, 1e10
 * - regexp: /pattern/flags
 * - operator: +, -, *, /, %, =, !=, <, <=, >, >=, &, .., ~>, :=
 * - punctuation: (, ), [, ], {, }, ,, ;, :, ?, |
 * - comment: (none in JSONata)
 */

import { StreamLanguage, type StringStream } from "@codemirror/language";

const KEYWORDS = new Set([
  "true",
  "false",
  "null",
  "and",
  "or",
  "in",
  "function",
  "lambda",
]);

interface JSONataState {
  inString: false | '"' | "'";
  inRegex: boolean;
}

function tokenize(stream: StringStream, state: JSONataState): string | null {
  // Handle string continuation
  if (state.inString) {
    const quote = state.inString;
    while (!stream.eol()) {
      const ch = stream.next();
      if (ch === "\\") {
        stream.next(); // skip escaped char
      } else if (ch === quote) {
        state.inString = false;
        return "string";
      }
    }
    return "string";
  }

  // Handle regex continuation
  if (state.inRegex) {
    while (!stream.eol()) {
      const ch = stream.next();
      if (ch === "\\") {
        stream.next();
      } else if (ch === "/") {
        // consume flags
        stream.eatWhile(/[gimsuy]/);
        state.inRegex = false;
        return "regexp";
      }
    }
    return "regexp";
  }

  // Skip whitespace
  if (stream.eatSpace()) return null;

  const ch = stream.peek();

  // String literals
  if (ch === '"' || ch === "'") {
    stream.next();
    state.inString = ch as '"' | "'";
    while (!stream.eol()) {
      const c = stream.next();
      if (c === "\\") {
        stream.next();
      } else if (c === ch) {
        state.inString = false;
        return "string";
      }
    }
    return "string";
  }

  // Regex literals
  if (ch === "/") {
    stream.next();
    state.inRegex = true;
    while (!stream.eol()) {
      const c = stream.next();
      if (c === "\\") {
        stream.next();
      } else if (c === "/") {
        stream.eatWhile(/[gimsuy]/);
        state.inRegex = false;
        return "regexp";
      }
    }
    return "regexp";
  }

  // Numbers
  if (/\d/.test(ch ?? "")) {
    stream.eatWhile(/[\d.eE+-]/);
    return "number";
  }

  // Variables: $identifier
  if (ch === "$") {
    stream.next();
    stream.eatWhile(/[\w]/);
    return "variableName.special";
  }

  // Operators
  if (ch === "~" && stream.match("~>", false)) {
    stream.next();
    stream.next();
    return "operator";
  }
  if (ch === ":" && stream.match(":=", false)) {
    stream.next();
    stream.next();
    return "operator";
  }
  if (ch === "." && stream.match("..", false)) {
    stream.next();
    stream.next();
    return "operator";
  }
  if (ch === "*" && stream.match("**", false)) {
    stream.next();
    stream.next();
    return "operator";
  }
  if (ch === "!" && stream.match("!=", false)) {
    stream.next();
    stream.next();
    return "operator";
  }
  if (ch === "<" && stream.match("<=", false)) {
    stream.next();
    stream.next();
    return "operator";
  }
  if (ch === ">" && stream.match(">=", false)) {
    stream.next();
    stream.next();
    return "operator";
  }
  if ("+-*/%=<>&^".includes(ch ?? "")) {
    stream.next();
    return "operator";
  }

  // Punctuation
  if ("()[]{},:;?|".includes(ch ?? "")) {
    stream.next();
    return "punctuation";
  }

  // Dot (path separator)
  if (ch === ".") {
    stream.next();
    return "punctuation";
  }

  // Identifiers / keywords
  if (/[\w]/.test(ch ?? "")) {
    stream.eatWhile(/[\w]/);
    const word = stream.current();
    if (KEYWORDS.has(word)) return "keyword";
    return "variableName";
  }

  // Backtick-quoted identifiers
  if (ch === "`") {
    stream.next();
    while (!stream.eol()) {
      if (stream.next() === "`") return "variableName";
    }
    return "variableName";
  }

  stream.next();
  return null;
}

export const jsonataLanguage = StreamLanguage.define<JSONataState>({
  startState: () => ({ inString: false, inRegex: false }),
  token: tokenize,
  languageData: {
    closeBrackets: { brackets: ["(", "[", "{", '"', "'", "`"] },
  },
});
