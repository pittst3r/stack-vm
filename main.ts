import StackVM, { Op } from './stack-vm';
import { logInstruction } from './utils';
import tokenize from './tokenizer';

const VM = new StackVM();

VM.addOperation(Op.Assign, function _opAssign(vm: StackVM) {
  let name = vm.stack.pop();
  let value = vm.stack.pop();

  vm.variables[name] = value;
});

VM.addOperation(Op.Call, function _opCall(vm: StackVM, value: any) {
  let labelAddress = vm.labels[value];

  vm.callStack.push([vm.pc, vm.variables]);
  vm.variables = {};

  vm.pc = labelAddress;
});

VM.addOperation(Op.GetValue, function _opGetValue(vm: StackVM) {
  let value = vm.stack.pop();

  if (!vm.variables.hasOwnProperty(value)) {
    throw `Variable '${value}' not found dog`;
  }

  vm.stack.push(vm.variables[value]);
});

VM.addOperation(Op.Jump, function _opJump(vm: StackVM, value: any) {
  let labelAddress = vm.labels[value];

  vm.pc = labelAddress;
});

VM.addOperation(Op.Label, function _opLabel() {
});

VM.addOperation(Op.Print, function _opPrint(vm: StackVM) {
  let poppedValue = vm.stack.pop();

  vm.stack.push(poppedValue);
  console.log(poppedValue);
});

VM.addOperation(Op.Push, function _opPush(vm: StackVM, value: any) {
  vm.stack.push(value);
});

VM.addOperation(Op.Return, function _opReturn(vm: StackVM) {
  let frame = vm.callStack.pop();
  
  if (!frame) {
    throw 'Nowhere to return to';
  }

  vm.pc = frame[0];
  vm.variables = frame[1];
});

VM.load([
  [Op.Jump, 'start'],
  [Op.Label, 'foo'],
  [Op.Push, 'middle'],
  [Op.Push, 'x'],
  [Op.Assign],
  [Op.Push, 'x'],
  [Op.GetValue],
  [Op.Print],
  [Op.Return],
  [Op.Label, 'start'],
  [Op.Push, 'first'],
  [Op.Print],
  [Op.Push, 'last'],
  [Op.Push, 'y'],
  [Op.Assign],
  [Op.Call, 'foo'],
  [Op.Push, 'y'],
  [Op.GetValue],
  [Op.Print]
]);

let runner = VM.run();
let step;
do {
  step = runner.next();
  logInstruction(step.value);
} while (!step.done)
