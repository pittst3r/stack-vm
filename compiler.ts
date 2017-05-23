import { Op } from './stack-vm';

export enum Type {
  Keyword,
  Label,
  Newline,
  Null,
  Numeral,
  String,
  Variable
}

export enum TokenizerState {
  Flush,
  Word,
  ReadChar
}

export interface Token {
  type: Type;
  value?: string;
}

export interface CharHandlerMap {
  [key: string]: Function;
}

function tokenize(program: string) {
  let tokens: any[] = [];
  let cursor: number = 0;
  let state: TokenizerState = TokenizerState.ReadChar;
  let token: Token = { type: Type.Null };

  while (cursor < program.length) {
    let char = program[cursor];

    switch (state) {
      case TokenizerState.ReadChar:
        if (isLetter(char)) {
          token = { type: Type.Keyword, value: char };
          cursor++;
          state = TokenizerState.Word
        } else if (isNumeral(char)) {
          token = { type: Type.Numeral, value: char };
          cursor++;
          state = TokenizerState.Word
        } else if (isColon(char)) {
          token = { type: Type.Label, value: '' };
          cursor++;
          state = TokenizerState.Word
        } else if (isSplat(char)) {
          token = { type: Type.Variable, value: '' };
          cursor++;
          state = TokenizerState.Word
        } else if (isQuote(char)) {
          token = { type: Type.String, value: '' };
          cursor++;
          state = TokenizerState.Word
        } else if (isNewline(char)) {
          token = { type: Type.Newline };
          cursor++;
          state = TokenizerState.Flush;
        } else if (isWhitespace(char)) {
          cursor++;
        } else {
          throw 'Syntax error';
        }
        break;
      case TokenizerState.Word:
        if (isLetter(char) || isNumeral(char)) {
          token.value = token.value!.concat(char);
          cursor++;
        } else if (isNewline(char)) {
          state = TokenizerState.Flush;
        } else if (isWhitespace(char) || isQuote(char)) {
          cursor++;
          state = TokenizerState.Flush;
        } else {
          throw 'Syntax error';
        }
        break;
      case TokenizerState.Flush:
        tokens.push(token);
        state = TokenizerState.ReadChar;
        break;
    }
  }

  return tokens;
}

function isLetter(char: string): boolean {
  return /[a-zA-Z]/.test(char);
}

function isNumeral(char: string): boolean {
  return /[0-9]/.test(char);
}

function isSplat(char: string): boolean {
  return char === '*';
}

function isColon(char: string): boolean {
  return char === ':';
}

function isQuote(char: string): boolean {
  return char === '\'';
}

function isWhitespace(char: string): boolean {
  return [' '].indexOf(char) > -1;
}

function isNewline(char: string): boolean {
  return /\n/.test(char);
}


interface AST {
  type: Syntax,
  body?: AST[],
  args?: AST[],
  value?: number | string
};

enum Syntax {
  Call,
  Label,
  Macro,
  NumberLiteral,
  Primitive,
  Program,
  StringLiteral,
  Variable
}

function parse(tokens: Token[]): AST {
  let cursor = 0;
  let ast: AST = {
    type: Syntax.Program,
    body: []
  };

  function walk(): AST | null {
    let token = tokens[cursor];

    switch (token.type) {
      case Type.Newline:
        cursor++;

        return null;

      case Type.Keyword: {
        let primitives = [
          'assign',
          'call',
          'jump',
          'label',
          'return'
        ];
        let isPrimitive = primitives.indexOf(token.value!) > -1;
        let node: AST = {
          type: isPrimitive ? Syntax.Primitive : Syntax.Macro,
          value: token.value,
          args: []
        };

        cursor++;

        while (cursor < tokens.length) {
          let arg = walk();
          if (!arg) break; // stop because we hit a newline
          node.args!.push(arg);
        }

        return node;
      }

      case Type.Label:
        cursor++;

        return {
          type: Syntax.Label,
          value: token.value
        };

      case Type.Variable:
        cursor++;

        return {
          type: Syntax.Variable,
          value: token.value
        };

      case Type.Numeral:
        cursor++;

        return {
          type: Syntax.NumberLiteral,
          value: token.value
        };

      case Type.String:
        cursor++;

        return {
          type: Syntax.StringLiteral,
          value: token.value
        };

      default:
        throw 'Wat';
    }
  }

  while (cursor < tokens.length) {
    let result = walk();

    if (result) {
      ast.body!.push(result);
    }
  }

  return ast;
}

function generate(ast: AST): string {
  switch (ast.type) {
    case Syntax.Program:
      if (!ast.body) throw 'AST body not present';

      return `[${ast.body.map(generate).join(',')}]`;

    case Syntax.Label:
      return `[${Op.LABEL},"${ast.value}"]`;

    case Syntax.NumberLiteral:
      return `${ast.value}`;

    case Syntax.Variable:
    case Syntax.StringLiteral:
      return `"${ast.value}"`;

    case Syntax.Primitive: {
      if (typeof ast.value !== 'string') throw 'Primitive AST values should be strings';

      let opKey = ast.value.toUpperCase();
      let op = Op[<any>opKey];

      if (op === undefined) throw `Opcode "${opKey}" not found`;

      if (ast.args!.length < 1) {
        return `[${op}]`;
      }

      if (ast.args!.length > 1) {
        let pushes = ast.args!.map(arg => {
          return `[${Op.PUSH},${generate(arg)}]`;
        }).join(',');
        return `${pushes},[${op}]`;
      }

      let arg = ast.args![0];

      if (arg.type === Syntax.Label) {
        return `[${op},"${arg.value}"]`;
      }

      return `[${op},${generate(arg)}]`;
    }

    case Syntax.Macro: {
      if (typeof ast.value !== 'string') throw 'Macro AST values should be strings';

      let opKey = ast.value.toUpperCase();
      let op = Op[<any>opKey];

      if (op === undefined) throw `Opcode "${opKey}" not found`;

      if (ast.args!.length > 0) {
        let pushes = ast.args!.map(arg => {
          if (arg.type === Syntax.Variable) {
            return `[${Op.GET},${generate(arg)}]`;
          }
          return `[${Op.PUSH},${generate(arg)}]`;
        }).join(',');

        return `${pushes},[${op}]`;
      }
    }

    default:
      throw 'Wat';
  }
}

export default function compile(program: string): string {
  return generate(parse(tokenize(program)));
}
