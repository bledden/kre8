import { useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { useAppStore } from '../stores/appStore';

export default function CodePanel() {
  const { currentCode } = useAppStore();

  if (!currentCode) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Generated Code</h2>
        <div className="text-gray-500 text-center py-12">
          <p>Generate music code to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Generated Code</h2>
        {currentCode.explanation && (
          <p className="text-sm text-gray-400">{currentCode.explanation}</p>
        )}
      </div>
      
      <CodeMirror
        value={currentCode.code}
        height="400px"
        extensions={[javascript({ jsx: false })]}
        theme={oneDark}
        editable={true}
        onChange={(value) => {
          // Allow manual editing
          useAppStore.getState().setCurrentCode({
            ...currentCode,
            code: value,
          });
        }}
      />
      
      {currentCode.metadata && (
        <div className="mt-4 text-sm text-gray-400">
          {currentCode.metadata.tempo && (
            <span className="mr-4">Tempo: {currentCode.metadata.tempo} BPM</span>
          )}
          {currentCode.metadata.instruments && currentCode.metadata.instruments.length > 0 && (
            <span>Instruments: {currentCode.metadata.instruments.join(', ')}</span>
          )}
        </div>
      )}
    </div>
  );
}

