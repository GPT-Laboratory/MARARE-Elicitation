import "regenerator-runtime/runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "global";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./app1/Redux/store.jsx";
import { RefProvider } from "./app1/Components/RefProvider.jsx";
import { AuthProvider } from "./app1/Components/authcontext.jsx";
import { ToggleProvider } from "./app1/Components/useToggleHook.jsx";
import { SnackbarProvider } from 'notistack'

// const navigate = useNavigate()
createRoot(document.getElementById("root")).render(
  
    <AuthProvider>
      <ToggleProvider>
        <Provider store={store}>
          <RefProvider>
            <SnackbarProvider >
            <App />
            </SnackbarProvider>
           
          </RefProvider>
        </Provider>
      </ToggleProvider>
    </AuthProvider>
 
);
