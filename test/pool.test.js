import { ChildProcessPool } from "../src/pool"
import child_process from "child_process"

jest.mock("child_process")
child_process.spawn.mockReturnValue({ pid: 1234 })

test("test get process successfully", () => {
  const pool = new ChildProcessPool(1)
  return pool.getProcess().then(process => {
    expect(process.pid).toBe(1234)
    expect(pool.activeProcesses.length).toBe(1)
    expect(pool.inactiveProcesses.length).toBe(0)
  })
})

test("test failed to get process", () => {
  const pool = new ChildProcessPool(1)
  return pool
    .getProcess()
    .then(() => {
      return pool.getProcess()
    })
    .catch(err => expect(err).toBe("max pool count"))
    .then(process => {
      expect(process).toBe(undefined)
    })
})

test("recycle", done => {
  const pool = new ChildProcessPool(1)
  return pool
    .getProcess()
    .then(process => {
      expect(pool.activeProcesses.length).toBe(1)
      expect(pool.inactiveProcesses.length).toBe(0)
      return pool.recycle(process)
    })
    .then(() => done())
})
