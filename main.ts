// Tiny stack VM — entry for make.fun tiny-stack-vm-01-run-20261122.
// Answers a whole set in one run: /input/<id>/program.bin + input.bin in,
// /output/<id>/stdout.bin + exit.txt out. Implements the kit ISA (32-bit
// wrapping ints, 256-value stack, 64-deep call stack, 256 words of memory,
// byte I/O, ten traps, 1,000,000-step and 65,536-byte limits). Node 22.
// Local runs: MAKEFUN_INPUT_DIR / MAKEFUN_OUTPUT_DIR override /input /output.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Opcode table: [byte, immediate bytes, pops, pushes] for the 38 opcodes.
const IMM = new Uint8Array(256), POP = new Uint8Array(256), PSH = new Uint8Array(256), KNOWN = new Uint8Array(256);
for (const [o, i, p, q] of [[0,0,0,0],[1,1,0,1],[2,4,0,1],[3,0,1,0],[4,0,1,2],[5,0,2,2],[6,0,2,3],[7,0,3,3],[16,0,2,1],[17,0,2,1],[18,0,2,1],[19,0,2,1],[20,0,2,1],[21,0,2,1],[22,0,2,1],[23,0,1,1],[24,0,2,1],[25,0,2,1],[26,0,2,1],[27,0,1,1],[28,0,2,1],[29,0,2,1],[30,0,2,1],[31,0,2,1],[32,0,2,1],[33,0,2,1],[34,0,2,1],[48,2,0,0],[49,2,1,0],[50,2,1,0],[51,2,0,0],[52,0,0,0],[64,0,1,1],[65,0,2,0],[80,0,1,0],[81,0,1,0],[82,0,0,1],[83,0,1,0]]) { KNOWN[o] = 1; IMM[o] = i; POP[o] = p; PSH[o] = q; }

// Runs one program on its input bytes; returns [stdout bytes, exit code].
function run(prog, input) {
  const n = prog.length;
  const st = new Int32Array(256);
  let sp = 0;
  const cs = new Int32Array(64);
  let cp = 0;
  const mem = new Int32Array(256);
  const out = new Uint8Array(65536);
  let ol = 0, ip = 0, pc = 0, steps = 0;
  const done = (e) => [out.subarray(0, ol), e];
  for (;;) {
    if (steps === 1000000) return done(10);
    if (pc < 0 || pc >= n) return done(9);
    const op = prog[pc];
    if (!KNOWN[op]) return done(5);
    const imm = IMM[op];
    if (pc + imm >= n) return done(9);
    steps++;
    const next = pc + 1 + imm;
    if (sp < POP[op]) return done(2);
    if (sp - POP[op] + PSH[op] > 256) return done(3);
    pc = next;
    switch (op) {
      case 0: return done(0);
      case 1: st[sp++] = (prog[next - 1] << 24) >> 24; break;
      case 2: st[sp++] = prog[next - 4] | (prog[next - 3] << 8) | (prog[next - 2] << 16) | (prog[next - 1] << 24); break;
      case 3: sp--; break;
      case 4: st[sp] = st[sp - 1]; sp++; break;
      case 5: { const t = st[sp - 1]; st[sp - 1] = st[sp - 2]; st[sp - 2] = t; break; }
      case 6: st[sp] = st[sp - 2]; sp++; break;
      case 7: { const a = st[sp - 3]; st[sp - 3] = st[sp - 2]; st[sp - 2] = st[sp - 1]; st[sp - 1] = a; break; }
      case 23: st[sp - 1] = (-st[sp - 1]) | 0; break;
      case 27: st[sp - 1] = ~st[sp - 1]; break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30:
      case 31: case 32: case 33: case 34: {
        const b = st[sp - 1], a = st[sp - 2];
        let r;
        switch (op) {
          case 16: r = (a + b) | 0; break;
          case 17: r = (a - b) | 0; break;
          case 18: r = Math.imul(a, b); break;
          case 19: if (b === 0) return done(4); r = (a === -2147483648 && b === -1) ? a : (a / b) | 0; break;
          case 20: if (b === 0) return done(4); r = b === -1 ? 0 : (a % b) | 0; break;
          case 21: if (b === 0) return done(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; break;
          case 22: if (b === 0) return done(4); r = ((a >>> 0) % (b >>> 0)) | 0; break;
          case 24: r = a & b; break;
          case 25: r = a | b; break;
          case 26: r = a ^ b; break;
          case 28: r = a << (b & 31); break;
          case 29: r = a >> (b & 31); break;
          case 30: r = (a >>> (b & 31)) | 0; break;
          case 32: r = a === b ? 1 : 0; break;
          case 33: r = a < b ? 1 : 0; break;
          default: r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        }
        sp -= 2; st[sp++] = r;
        break;
      }
      case 48: case 49: case 50: {
        const rel = ((prog[next - 2] | (prog[next - 1] << 8)) << 16) >> 16;
        if (op === 48 || (op === 49 ? st[--sp] === 0 : st[--sp] !== 0)) pc = next + rel;
        break;
      }
      case 51:
        if (cp === 64) return done(7);
        cs[cp++] = next;
        pc = prog[next - 2] | (prog[next - 1] << 8);
        break;
      case 52:
        if (cp === 0) return done(8);
        pc = cs[--cp];
        break;
      case 64: {
        const a = st[sp - 1];
        if (a < 0 || a > 255) return done(6);
        st[sp - 1] = mem[a];
        break;
      }
      case 65: {
        const a = st[sp - 1], v = st[sp - 2];
        if (a < 0 || a > 255) return done(6);
        sp -= 2; mem[a] = v;
        break;
      }
      case 80: {
        const s = String(st[sp - 1]);
        if (ol + s.length > 65536) return done(11);
        sp--;
        for (let i = 0; i < s.length; i++) out[ol++] = s.charCodeAt(i);
        break;
      }
      case 81:
        if (ol + 1 > 65536) return done(11);
        out[ol++] = st[--sp] & 255;
        break;
      case 82: st[sp++] = ip < input.length ? input[ip++] : -1; break;
      case 83: return done(st[--sp] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  let stdout = new Uint8Array(0), exit = 0;
  try {
    [stdout, exit] = run(readFileSync(join(I, id, 'program.bin')), readFileSync(join(I, id, 'input.bin')));
  } catch { /* a broken instance still gets a well-formed answer */ }
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), stdout);
  writeFileSync(join(O, id, 'exit.txt'), String(exit) + '\n');
}
