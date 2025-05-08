import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createBrowserHistory } from "history";

// Create and export history object
export const history = createBrowserHistory();

createRoot(document.getElementById("root")!).render(<App />);
