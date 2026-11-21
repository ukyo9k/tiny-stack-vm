# tiny-stack-vm

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/ukyo9k/tiny-stack-vm/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/ukyo9k/tiny-stack-vm/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

A tiny stack VM in one file (`main.ts`, Node 22, no dependencies), built for the
[make.fun bounty](https://make.fun/bounty/tiny-stack-vm-01-run-20261122). It runs
all 40 instances of a set in one go — reading `program.bin` + `input.bin` and
writing `stdout.bin` + `exit.txt` per instance — implementing the kit ISA
faithfully: 32-bit wrapping arithmetic, a 256-value stack, calls, 256 words of
memory, byte I/O, all ten traps with their exact exit codes, and the step and
output limits.
