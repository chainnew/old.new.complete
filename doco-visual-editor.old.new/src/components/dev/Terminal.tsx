import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#38bdf8',
        cursorAccent: '#0f172a',
        black: '#1e293b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e2e8f0',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f1f5f9',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\x1b[1;36m╔══════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;36m║\x1b[0m  \x1b[1;37mWelcome to Doco Terminal\x1b[0m                              \x1b[1;36m║\x1b[0m');
    term.writeln('\x1b[1;36m║\x1b[0m  \x1b[37mFull Linux functionality powered by xterm.js\x1b[0m         \x1b[1;36m║\x1b[0m');
    term.writeln('\x1b[1;36m╚══════════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[33mNote:\x1b[0m This is a simulated terminal. For full shell access,');
    term.writeln('we need to connect to a backend with node-pty or web container.');
    term.writeln('');
    term.write('\x1b[1;32m$\x1b[0m ');

    // Handle input (simple echo for now - needs backend for real shell)
    let currentLine = '';
    term.onData((data) => {
      const code = data.charCodeAt(0);

      // Handle Enter key
      if (code === 13) {
        term.writeln('');
        if (currentLine.trim()) {
          handleCommand(currentLine.trim(), term);
        }
        currentLine = '';
        term.write('\x1b[1;32m$\x1b[0m ');
      }
      // Handle Backspace
      else if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      }
      // Handle Ctrl+C
      else if (code === 3) {
        term.writeln('^C');
        currentLine = '';
        term.write('\x1b[1;32m$\x1b[0m ');
      }
      // Normal character input
      else {
        currentLine += data;
        term.write(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const handleCommand = (command: string, term: XTerm) => {
    const cmd = command.toLowerCase().trim();

    // Simple built-in commands
    if (cmd === 'clear' || cmd === 'cls') {
      term.clear();
    } else if (cmd === 'help') {
      term.writeln('\x1b[1;36mAvailable commands:\x1b[0m');
      term.writeln('  \x1b[33mclear\x1b[0m     - Clear terminal');
      term.writeln('  \x1b[33mhelp\x1b[0m      - Show this help');
      term.writeln('  \x1b[33mls\x1b[0m        - List files (simulated)');
      term.writeln('  \x1b[33mpwd\x1b[0m       - Print working directory');
      term.writeln('  \x1b[33mwhoami\x1b[0m    - Display current user');
      term.writeln('');
      term.writeln('\x1b[90mFor full shell functionality, connect to backend.\x1b[0m');
    } else if (cmd === 'ls') {
      term.writeln('\x1b[34msrc/\x1b[0m     \x1b[34mpublic/\x1b[0m     \x1b[37mpackage.json\x1b[0m     \x1b[37mREADME.md\x1b[0m');
    } else if (cmd === 'pwd') {
      term.writeln('/Users/matto/old.new/doco-new-editor.old.new');
    } else if (cmd === 'whoami') {
      term.writeln('doco-user');
    } else if (cmd.startsWith('echo ')) {
      term.writeln(command.substring(5));
    } else if (cmd === '') {
      // Empty command, do nothing
    } else {
      term.writeln(`\x1b[31mbash: ${cmd}: command not found\x1b[0m`);
      term.writeln('\x1b[90mType "help" for available commands.\x1b[0m');
    }
  };

  return (
    <div
      ref={terminalRef}
      className="h-full w-full bg-slate-900 p-2"
      style={{ overflow: 'hidden' }}
    />
  );
}
