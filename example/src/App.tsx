import React from "react"
import MonacoEditor from "react-monaco-editor"
import { editor } from "monaco-editor"
import { listen, Disposable } from "vscode-ws-jsonrpc"
import { MonacoServices, Services } from "monaco-languageclient"
import {
  createUrl,
  createWebSocket,
  createLanguageClient
} from "./language-client"

interface AppState {
  code: string
}

class App extends React.Component<{}, AppState> {
  private me: any = null
  public wsService: Disposable | null = null
  public lc: Disposable | null = null

  state = {
    code: "import json\n"
  }

  private resize = () => {
    if (this.me) {
      this.me.editor.layout()
    }
  }

  private editorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editor.focus()
  }

  private renderEditor = () => {
    const meRef = (me: any) => (this.me = me)
    const setCode = (code: string) => this.setState({ code })
    const options: editor.IEditorOptions = {
      fontFamily: "Menlo"
    }
    return (
      <MonacoEditor
        ref={meRef}
        editorDidMount={this.editorDidMount}
        language={"python"}
        theme={"vs-dark"}
        value={this.state.code}
        onChange={setCode}
        options={options}
      />
    )
  }

  public componentDidMount() {
    window.addEventListener("resize", this.resize)

    if (this.me) {
      const service = MonacoServices.create(this.me.editor)
      this.wsService = Services.install(service)

      const url = createUrl("/python")
      const webSocket = createWebSocket(url)

      listen({
        webSocket: webSocket,
        onConnection: connection => {
          const languageClient = createLanguageClient(connection)
          const disposable = languageClient.start()
          this.lc = disposable
          connection.onClose(() => disposable.dispose())
        }
      })
    }
  }

  public componentWillUnmount() {
    window.removeEventListener("resize", this.resize)
    if (this.wsService) {
      this.wsService.dispose()
    }
    if (this.lc) {
      this.lc.dispose()
    }
    this.wsService = null
    this.me = null
    this.lc = null
  }

  public render() {
    const style: React.CSSProperties = {
      height: "100vh"
    }
    return <div style={style}>{this.renderEditor()}</div>
  }
}

export default App
