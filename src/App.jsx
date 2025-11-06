

import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import Protectedroutes from "./app1/Components/Protectedroutes";
import Auth from "./app1/Components/Auth";
import Header from "./component/Header";
import HomePage from "./component/HomePage";
import UpdatePassword from "./app1/Components/updatePassword";
import CreateProject from "./app2/components/CreateProject";
import supabase from "./app1/Components/supabaseclient";
// import App2 from "./app2/App";
import MainApp from "./app1/Components/MainApp";
import EndMeetingMessage from "./app1/Components/EndMeetingMessage";
import Content from "./app1/Components/Content";
import Rag from "./app1/Components/RAG_process_files/Rag";
import EditItem from "./app2/EditItem";
import AddItem from "./app2/AddItem";
// import Personas_list from "./app2/helper/Personas_list";
// import Add_Personas from "./app2/helper/Add_Personas";

import "./app2/App.css";
import './App.css';
import ProjectDetails from './component/ProjectDetails';
import { Footer } from 'antd/es/layout/layout';
// import AddConnectorModel from "./app2/components/AddConnectorPage";
// import AddConnectorPage from "./app2/components/AddConnectorPage";
// import RAG_CHATBOT from "./component/Rag_Chatbot";
import MvpVisionDisplay from "./app1/Components/MvpVisionDisplay";

const Layout = ({ children, isLoggedIn, setIsLoggedIn }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogin = () => navigate("/login");
  const handleRegister = () => navigate("/register");
  const handler = () => {
    handleLogin();
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div className={isDarkMode ? "dark" : ""}>
        <div className="layout-wrapper">
            <Header
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            isLoggedIn={isLoggedIn}
            onLogin={handleLogin}
            handler={handler}
        />
  

          <main className="layout-content">
            {React.cloneElement(children, {
              onLogin: handleLogin,
              onRegister: handleRegister,
              setIsLoggedIn,
            })}
            
          </main>


          <Footer className="layout-footer">
            <div style={{ float: 'right', lineHeight: 0 }}>
              <p>&copy; {new Date().getFullYear()} GPT LAB. All rights reserved.</p>
            </div>
          </Footer>

        </div>
      </div>
    </ConfigProvider>

  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Manage login status here
  // Check Supabase session on first load
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setIsLoggedIn(true);
      }
    };
    checkSession();

    // Optional: Listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const hideClsBtn = true;
  const isSignup = true;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <Auth setIsLoggedIn={setIsLoggedIn} />
            </Layout>
          }
        />
        

        <Route
          path="/register"
          element={
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <Auth setIsLoggedIn={setIsLoggedIn} isSignup={isSignup} />
            </Layout>
          }
        />
        {/* <Route
          path="/:project_name/:project_id/connectors"
          element={
            <Protectedroutes>
              <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
                <AddConnectorPage />
              </Layout>
            </Protectedroutes>
          }
        /> */}

        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Protectedroutes>
                <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
                  <CreateProject />
                </Layout>
              </Protectedroutes>
            ) : (
              <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
                <HomePage />
              </Layout>
            )
          }
        />

        <Route
          path="/create-meeting/:project_name/:id"
          element={
            <Protectedroutes>
              <Layout>
                <MainApp />
              </Layout>
            </Protectedroutes>
          }
        />

        <Route
          path="/endmeeting/:id"
          element={
            <Protectedroutes>
              <Layout>
                <EndMeetingMessage />
              </Layout>
            </Protectedroutes>
          }
        />

        <Route
          path="/:project_id/:id"
          element={
            <Protectedroutes>
              <Content />
            </Protectedroutes>
          }
        />
        <Route
          path="/analysis"
          element={
            <Protectedroutes>
              <Layout>
                <Rag />
              </Layout>
            </Protectedroutes>
          }
        />
        <Route
          path="/project/:id/:storyId"
          // path="/project/:id/"
          element={
            <Protectedroutes>
              <Layout>
                <MvpVisionDisplay/>
              </Layout>
            </Protectedroutes>
          }
        />
        {/* <Route
          path="/project/RAG_ChatBot"
          element={
            <Protectedroutes>
              <Layout>
                 <RAG_CHATBOT/>
              </Layout>
            </Protectedroutes>
          }
        /> */}
        <Route
          path="/project_details/:project_name/:id"
          element={
            <Protectedroutes>
              <Layout>
                {/* <App2 /> */}
                <ProjectDetails />
              </Layout>
            </Protectedroutes>
          }
        />
        <Route
          path="/project/:id"
          element={
            <Protectedroutes>
              <Layout>
                {/* <App2 /> */}
                <MvpVisionDisplay/>
              </Layout>
            </Protectedroutes>
          }
        />
        <Route
          path="/edit/:key/:id/:storyId"
          element={
            <Protectedroutes>
              <Layout>
                <EditItem />
              </Layout>
            </Protectedroutes>
          }
        />
        <Route
          path="/add"
          element={
            <Protectedroutes>
              <Layout>
                <AddItem />
              </Layout>
            </Protectedroutes>
          }
        />
        <Route
          path="/add_agent/:id/:storyId"
          element={
            <Protectedroutes>
              <Layout>
                {/* <Add_Personas /> */}
              </Layout>
            </Protectedroutes>
          }
        />
        <Route
          path="/agent_list/:id/:storyId"
          element={
            <Protectedroutes>
              <Layout>
                {/* <Personas_list /> */}
              </Layout>
            </Protectedroutes>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
              <Protectedroutes>
                <UpdatePassword />
              </Protectedroutes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
