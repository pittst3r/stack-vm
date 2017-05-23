import StackVM, { Op } from './stack-vm';
import compile from './compiler';
import * as fs from 'fs';

const VM = new StackVM();

VM.addOperation(Op.ASSIGN, function _opAssign(vm: StackVM) {
  let value = vm.stack.pop();
  let name = vm.stack.pop();

  vm.variables[name] = value;
});

VM.addOperation(Op.CALL, function _opCall(vm: StackVM, value: any) {
  let labelAddress = vm.labels[value];

  vm.callStack.push([vm.pc, vm.variables]);
  vm.variables = {};

  vm.pc = labelAddress;
});

VM.addOperation(Op.GET, function _opGetValue(vm: StackVM, value: any) {
  if (!vm.variables.hasOwnProperty(value)) {
    throw `Variable '${value}' not found dog`;
  }

  vm.stack.push(vm.variables[value]);
});

VM.addOperation(Op.JUMP, function _opJump(vm: StackVM, value: any) {
  let labelAddress = vm.labels[value];

  vm.pc = labelAddress;
});

VM.addOperation(Op.LABEL, function _opLabel() {
});

VM.addOperation(Op.PRINT, function _opPrint(vm: StackVM) {
  let poppedValue = vm.stack.pop();

  vm.stack.push(poppedValue);
  console.log(poppedValue);
});

VM.addOperation(Op.PUSH, function _opPush(vm: StackVM, value: any) {
  vm.stack.push(value);
});

VM.addOperation(Op.RETURN, function _opReturn(vm: StackVM) {
  let frame = vm.callStack.pop();
  
  if (!frame) {
    throw 'Nowhere to return to';
  }

  vm.pc = frame[0];
  vm.variables = frame[1];
});

let testFile = fs.readFileSync('test.asm').toString();
let compiled = compile(testFile);

VM.load(compiled);

let runner = VM.run();
let step;
do {
  step = runner.next();
} while (!step.done)
