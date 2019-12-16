import { spawn } from "child_process"

const COMMAND = "pyls"
const COMMAND_ARGS = ["-v", "--check-parent-process"]

export class ChildProcessPool {
  constructor(size = 100) {
    this.size = size
    console.log("pool size: ", size)
    this.activeProcesses = []
    this.inactiveProcesses = []
  }

  _activeProcessesLength() {
    return this.activeProcesses.length
  }

  _inactiveProcessesLength() {
    return this.inactiveProcesses.length
  }

  _append() {
    return new Promise((res, rej) => {
      if (this._activeProcessesLength() < this.size) {
        const newProcess = spawn(COMMAND, COMMAND_ARGS)
        console.log(newProcess)

        this.activeProcesses.push(newProcess)
        res(newProcess)
      } else {
        const err = "max pool count"
        rej(err)
      }
    })
  }

  getProcess() {
    return new Promise((res, rej) => {
      if (this._inactiveProcessesLength() > 0) {
        const process = this.inactiveProcesses.pop()
        this.activeProcesses.push(process)
        res(process)
      } else {
        this._append()
          .then(process => res(process))
          .catch(err => rej(err))
      }
    })
  }

  recycle(process) {
    return new Promise((res, rej) => {
      const index = this.activeProcesses.indexOf(process)
      if (index === -1) {
        rej("process does not exist")
      } else {
        this.activeProcesses.splice(index, 1)
        this.inactiveProcesses.push(process)
        res()
      }
    })
  }
}
