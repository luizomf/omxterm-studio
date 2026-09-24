import { useState, type CSSProperties, type ReactNode } from "react";
import type {
  TerminalTheme,
  TerminalThemeColorKey,
} from "./contract/terminal-theme";
import { resolvedAppearance, type Configuration } from "./configuration";
import { TabStrip } from "./tab-strip";

export type Scene = "workspace" | "fastfetch" | "htop";
export const ANSI_NAMES = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
] as const;
export const BRIGHT_NAMES = [
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
] as const;

function C({
  color = "foreground",
  bold = false,
  dim = false,
  children,
}: {
  color?: TerminalThemeColorKey;
  bold?: boolean;
  dim?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`${bold ? "ansi-bold" : ""} ${dim ? "ansi-dim" : ""}`}
      style={{ color: `var(--ansi-${color})` }}
    >
      {children}
    </span>
  );
}

function Prompt({ command }: { command?: string }) {
  return (
    <div className="prompt">
      <div>
        <C color="blue">demo@studio</C>:<C color="magenta">~/workspace</C>{" "}
        <C color="brightBlue">&#123;main&#125;</C>
      </div>
      <div>
        <C color="green">❯ </C>
        {command || <span className="cursor"> </span>}
      </div>
    </div>
  );
}

function TextScene() {
  return (
    <section className="text-scene" aria-label="Text and ANSI samples">
      <Prompt command="cat welcome.md" />
      <div className="terminal-copy">
        <C color="yellow" bold>
          # Make yourself at home.
        </C>
        <br />
        <br />
        This is your terminal.
        <br />A little quieter. A little brighter.
        <br />
        <C bold>Exactly the way you like it.</C>
        <br />
        <br />
        <C color="cyan">Colors should work together,</C>
        <br />
        not just look good in little squares.
        <br />
        <br />
        <C color="green">+ a change worth keeping</C>
        <br />
        <C color="red">- a line you can leave behind</C>
        <br />
        <C color="blue">→ src/</C> <C dim>components · themes · tests</C>
        <br />
        <br />
        <C color="yellow">warning</C> <C dim>the coffee is getting cold</C>
        <br />
        <C color="red" bold>
          error
        </C>{" "}
        <C>just a color sample, promise</C>
        <br />
        <C color="green">success</C> <C>all 24 checks passed</C>
        <br />
        <br />
        <span className="selected-text"> a little selected text </span>{" "}
        <span className="cursor"> </span>
        <br />
        <br />
        <C bold>Same color. Different emphasis.</C>
        <br />
        <C color="white">white</C>{" "}
        <C color="white" bold>
          white + bold
        </C>{" "}
        <C color="white" dim>
          white + dim
        </C>
        <br />
        <C color="brightBlack">bright black</C>{" "}
        <C color="brightBlue">bright blue</C>
      </div>
      <div className="ansi-text-grid">
        {ANSI_NAMES.slice(1).map((color) => (
          <div key={color}>
            <C color={color}>{color.padEnd(8)}</C>
            <C color={color} bold>
              bold{" "}
            </C>
            <C color={color} dim>
              dim
            </C>
          </div>
        ))}
      </div>
      <Prompt />
    </section>
  );
}

function FastfetchScene({ config }: { config: Configuration }) {
  const logo = [
    "      ▄████▄      ",
    "   ▄██▀    ▀██▄   ",
    "  ██   ▄▄▄▄   ██  ",
    " ██   ██  ██   ██ ",
    " ██   ██  ██   ██ ",
    "  ██   ▀▀▀▀   ██  ",
    "   ▀██▄    ▄██▀   ",
    "      ▀████▀      ",
  ];
  const values = [
    ["OS", "Studio Linux arm64"],
    ["Host", "Your next favorite setup"],
    ["Shell", "zsh"],
    ["Terminal", "OMXTerm"],
    ["Theme", "Live preview"],
    ["Font", config.font?.family || "Browser monospace"],
    ["CPU", "4 cores, zero real load"],
    ["Memory", "2.4 GiB / 16 GiB"],
    ["Disk", "18 GiB / 256 GiB"],
  ];
  const logoColors = [
    "green",
    "green",
    "yellow",
    "red",
    "brightRed",
    "magenta",
    "blue",
    "brightBlue",
  ] as const;
  return (
    <section className="fastfetch-scene" aria-label="Simulated fastfetch">
      <Prompt command="fastfetch" />
      <div className="fetch-body">
        <pre className="fetch-logo" aria-hidden="true">
          {logo.map((line, i) => (
            <div key={line + i}>
              <C color={logoColors[i]} bold>
                {line}
              </C>
            </div>
          ))}
        </pre>
        <div className="fetch-facts">
          <C color="blue" bold>
            demo
          </C>
          @
          <C color="magenta" bold>
            studio
          </C>
          <br />
          <C dim>───────────</C>
          <br />
          {values.map(([label, value]) => (
            <div key={label}>
              <C color="yellow" bold>
                {label}:{" "}
              </C>
              {value}
            </div>
          ))}
          <div className="palette-blocks" aria-label="16 ANSI swatches">
            {[ANSI_NAMES, BRIGHT_NAMES].map((row, i) => (
              <div key={i}>
                {row.map((color) => (
                  <span
                    key={color}
                    title={color}
                    style={{ background: `var(--ansi-${color})` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HtopScene() {
  const processes = [
    ["1842", "2.4", "1.8", "zsh"],
    ["2068", "0.7", "2.1", "editor"],
    ["3145", "1.2", "0.6", "dev-server"],
    ["4260", "0.0", "0.3", "tmux"],
    ["5092", "0.0", "0.2", "htop"],
  ];
  return (
    <section className="htop-scene" aria-label="Simulated htop">
      <div className="cpu-grid">
        {[37, 12, 0, 0].map((value, i) => (
          <div key={i}>
            <C color="cyan">{i}</C>[
            <C color="green">{"┃".repeat(Math.ceil(value / 5))}</C>
            <C color="brightBlack">{"┃".repeat(8 - Math.ceil(value / 5))}</C>
            <C color={value ? "foreground" : "brightBlack"}>
              {String(value.toFixed(1)).padStart(5)}%
            </C>
            ]
          </div>
        ))}
      </div>
      <div>
        <C color="cyan">Mem</C>[<C color="green">┃┃┃</C>
        <C color="magenta">┃</C>
        <C color="brightBlack">┃┃┃┃┃┃┃┃</C> <C color="yellow">2.4G</C>/16G]
      </div>
      <div>
        <C color="cyan">Swp</C>[<C color="brightBlack">┃┃┃┃┃┃┃┃┃┃┃┃</C>{" "}
        <C color="brightBlack">0K</C>/2.0G]
      </div>
      <div className="htop-info">
        Tasks:{" "}
        <C color="green" bold>
          74
        </C>
        , <C color="green">128</C> thr; <C color="green">1</C> running
        <br />
        Load average: <C color="cyan">0.42 0.38 0.21</C>
      </div>
      <div className="process-heading">
        {"  PID  USER      CPU% MEM%  Command"}
      </div>
      {processes.map(([pid, cpu, mem, name], i) => (
        <div
          className={`process-row ${i === 0 ? "process-selected" : ""}`}
          key={pid}
        >
          {`${pid.padStart(5)}  demo     ${cpu.padStart(4)} ${mem.padStart(4)}  ${name}`}
        </div>
      ))}
      <div className="htop-keys">
        {["Help", "Setup", "Search", "Filter", "Tree"].map((label, i) => (
          <span key={label}>
            F{i + 1}
            <span>{label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

const snippets = [
  ["System overview", "Display system info and terminal colors"],
  ["Git status", "Review the working tree"],
  ["Build project", "Run the project build"],
  ["Project files", "List files, including hidden entries"],
  ["Hello, terminal", "A little color for your command line"],
];

function Snippets({ onDemo }: { onDemo: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = snippets.filter((entry) =>
    entry.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <aside className="preview-snippets" aria-label="Simulated snippets sidebar">
      <input
        type="search"
        aria-label="Search preview snippets"
        placeholder="Search snippets"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul>
        {filtered.map(([name, description]) => (
          <li key={name}>
            <button onClick={onDemo}>
              <strong>{name}</strong>
              <span>{description}</span>
            </button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p>No matching snippets</p>}
    </aside>
  );
}

export function Preview({
  theme,
  config,
  scene,
  onScene,
  tabs,
  snippets: showSnippets,
  comparing,
  onDemo,
}: {
  theme: TerminalTheme;
  config: Configuration;
  scene: Scene;
  onScene: (value: Scene) => void;
  tabs: boolean;
  snippets: boolean;
  comparing: boolean;
  onDemo: () => void;
}) {
  const appearance = resolvedAppearance(config);
  const variables = Object.fromEntries(
    Object.entries(theme.colors).map(([key, value]) => [
      `--ansi-${key}`,
      value,
    ]),
  );
  const family = appearance.family
    ? `"${appearance.family.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}", monospace`
    : '"FiraCode Nerd Font Mono", "Fira Code", "SFMono-Regular", Consolas, "Liberation Mono", monospace';
  const style = {
    ...variables,
    "--preview-font": family,
    "--preview-size": `${appearance.size}px`,
    "--preview-line-height": appearance.lineHeight,
    "--preview-ligatures": appearance.ligatures ? "normal" : "none",
    "--padding-top": `${appearance.padding.top}px`,
    "--padding-right": `${appearance.padding.right}px`,
    "--padding-bottom": `${appearance.padding.bottom}px`,
    "--padding-left": `${appearance.padding.left}px`,
  } as CSSProperties;
  return (
    <div
      className="terminal-window"
      style={style}
      data-testid="terminal-preview"
    >
      <div className="window-titlebar">
        <span className="traffic-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          {comparing ? "REFERENCE" : theme.name}{" "}
          <span className="titlebar-separator">/</span> appearance preview
        </span>
      </div>
      {tabs && (
        <TabStrip
          className="preview-tabs"
          label="Preview scenes"
          choices={[
            { value: "workspace", label: "zsh · workspace" },
            { value: "fastfetch", label: "fastfetch · demo" },
            { value: "htop", label: "htop · demo" },
          ]}
          value={scene}
          onChange={onScene}
        />
      )}
      <div className="preview-body">
        <div className="terminal-column">
          <div className="terminal-scroll">
            <div className={`scene-layout scene-${scene}`}>
              {scene === "workspace" && <TextScene />}
              {scene !== "htop" && <FastfetchScene config={config} />}
              {scene !== "fastfetch" && <HtopScene />}
            </div>
          </div>
          <div className="tmux-status">
            <span>
              <C color="white" dim>
                code:1{" "}
              </C>
              <C color="brightBlue">term:2* </C>
              <C color="white" dim>
                logs:3
              </C>
            </span>
            <C color="white" dim>
              studio [demo]
            </C>
          </div>
        </div>
        {showSnippets && <Snippets onDemo={onDemo} />}
      </div>
    </div>
  );
}
