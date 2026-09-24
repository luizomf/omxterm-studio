import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./studio.css";
import "./preview.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
