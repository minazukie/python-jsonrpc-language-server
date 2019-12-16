import WebSocket from "ws"
import { ChildProcessPool } from "./pool"

const wss = new WebSocket.Server({
  port: 9999,
  path: "/python",
  clientTracking: true
})

const pool = new ChildProcessPool()

function getContentLength(header) {
  return parseInt(header.split("Content-Length: ")[1])
}

const pidLogPrefix = pid => {
  return `[PID: ${pid}]`
}

wss.on("connection", ws => {
  pool
    .getProcess()
    .then(pyls => {
      const logPrefix = pidLogPrefix(pyls.pid)
      console.log(logPrefix, `spawn pyls subprocess`)

      let contentLength = 0
      let body = ""

      pyls.stderr.on("data", data => console.log(logPrefix, data.toString()))

      pyls.stdout.on("data", data => {
        const dataString = data.toString()
        const [header, jsonContent] = dataString.split("\r\n\r\n")
        console.log(logPrefix, "json content: ", jsonContent)

        if (!jsonContent) {
          body += dataString
          if (contentLength === Buffer.byteLength(body, "utf-8")) {
            ws.send(body)
            body = ""
            contentLength = 0
          }
          return
        } else {
          contentLength = getContentLength(header)
          if (contentLength >= 8192 - Buffer.byteLength(header, "utf-8")) {
            body = jsonContent
            return
          }
        }
        ws.send(jsonContent)
        contentLength = 0
      })

      pyls.on("exit", () => {
        ws.close(1000)
        pool.recycle(pyls, true)
      })

      ws.on("message", data => {
        console.log(logPrefix, "receive data: ", data)
        const contentLength = Buffer.byteLength(data, "utf-8")
        const resp = `Content-Length: ${contentLength}\r\nContent-Type: application/vscode-jsonrpc; charset=utf-8\r\n\r\n${data}`
        try {
          pyls.stdin.write(resp)
        } catch (e) {
          ws.close(1000)
          pool.recycle(pyls, true)
        }
      })

      ws.on("close", () => {
        pool.recycle(pyls).catch(() => {})
        console.log(logPrefix, `connection closed, recycling process`)
      })
    })
    .catch(err => ws.close(1000, err))
})
