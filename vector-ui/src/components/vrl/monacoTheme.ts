import type { editor } from 'monaco-editor';

export const vectorDarkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '5a5850' },
    { token: 'keyword', foreground: 'c8b88a' },
    { token: 'string', foreground: '4a9e6a' },
    { token: 'number', foreground: 'd4860a' },
    { token: 'identifier', foreground: 'e8e6df' },
  ],
  colors: {
    'editor.background': '#0a0a08',
    'editor.foreground': '#e8e6df',
    'editor.lineHighlightBackground': '#111110',
    'editor.selectionBackground': '#2a2a2555',
    'editor.inactiveSelectionBackground': '#2a2a2533',
    'editorCursor.foreground': '#c8b88a',
    'editorLineNumber.foreground': '#5a5850',
    'editorLineNumber.activeForeground': '#9a9890',
    'editorWidget.background': '#111110',
    'editorWidget.border': '#333330',
    'input.background': '#1a1a17',
    'input.border': '#2a2a25',
  },
};

export function registerMonacoTheme(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('vector-dark', vectorDarkTheme);
}
