export enum Op {
  ASSIGN,
  CALL,
  GET,
  JUMP,
  LABEL,
  PRINT,
  PUSH,
  RETURN
}

export type Program = Instruction[];

export type Instruction = [Op, any] | [any];

export type Stack = any[];

export type Operation = (vm: StackVM, value?: any) => void;

export type Frame = [number, Dict<any>];

export interface Operations {
  [key: number]: Operation;
}

export interface Dict<T> {
  [key: string]: T;
}

export interface Generator {
  next: (...args: any[]) => any;
  done: boolean;
}

export default class StackVM {
  callStack: Frame[] = [];
  labels: Dict<number> = {};
  operations: Operations = {};
  pc: number = 0;
  program: Program;
  stack: Stack = [];
  variables: Dict<any> = {};

  addOperation(opcode: Op, operation: Operation): void {
    this.operations[opcode] = operation;
  }

  load(program: Program): void {
    this.scan(program);
    this.program = program;
  }

  run(): IterableIterator<Instruction> {
    function* processInstruction(vm: StackVM): IterableIterator<Instruction> {
      while (vm.pc < vm.program.length) {
        let instruction: Instruction = vm.program[vm.pc];
        let op: Op = instruction[0];
        let value: any = instruction[1];

        vm.operations[op](vm, value);
        vm.pc++;
        yield instruction;
      }
    }

    return processInstruction(this);
  }

  private scan(program: Program): void {
    this.labels = program.reduce((memo, instruction, pc) => {
      let op: Op = instruction[0];
      let value: any = instruction[1];

      if (op === Op.LABEL) {
        memo[value] = pc;
      }

      return memo;
    }, {} as Dict<number>);
  }
}
