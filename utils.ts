import { Instruction, Op } from './stack-vm';

export function logInstruction(instruction: Instruction) {
  if (!instruction) return;

  let opcode = Op[instruction[0]];
  let value = instruction[1];

  if (value) {
    console.log([opcode, value]);
  } else {
    console.log([opcode]);
  }
}
