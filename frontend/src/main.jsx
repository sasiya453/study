- import { BrowserRouter } from "react-router-dom";
+ import { HashRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
-   <BrowserRouter>
+   <HashRouter>
      <App />
-   </BrowserRouter>
+   </HashRouter>
  </React.StrictMode>
);
