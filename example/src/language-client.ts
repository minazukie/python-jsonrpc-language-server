import { MessageConnection } from "vscode-jsonrpc"
import {
  MonacoLanguageClient,
  ErrorAction,
  CloseAction,
  createConnection
} from "monaco-languageclient"

const ReconnectingWebSocket = require("reconnecting-websocket")

const HOST = "localhost:9999"

export function createUrl(path: string): string {
  // const protocol = location.protocol === "https:" ? "wss" : "ws"
  const protocol = "ws"
  return `${protocol}://${HOST}${path}`
}

export function createWebSocket(url: string): WebSocket {
  const socketOptions = {
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 10000,
    maxRetries: 60,
    debug: false
  }
  return new ReconnectingWebSocket(url, [], socketOptions)
}

export function createLanguageClient(
  connection: MessageConnection
): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: "Sample Language Client",
    clientOptions: {
      documentSelector: ["python"],
      errorHandler: {
        error: () => ErrorAction.Continue,
        closed: () => CloseAction.DoNotRestart
      }
    },
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(
          createConnection(connection, errorHandler, closeHandler)
        )
      }
    }
  })
}
