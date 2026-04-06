import { useState } from "react";
import { CodeEditor, CodePreview } from "@/components/custom/codeEditor";

export default function TestEditor() {
  const [code, setCode] = useState(`function hello(){
  console.log("[ANS:world]");
}`);

  return (
    <div style={{ padding: 20 }}>
      <h2>Editor</h2>

      <CodeEditor
        value={code}
        onChange={setCode}
        language="javascript"
        blankStyle="exact"
      />

      <h2 style={{ marginTop: 30 }}>Preview</h2>

      <CodePreview
        code={code}
        language="javascript"
        blankStyle="exact"
      />
    </div>
  );
}