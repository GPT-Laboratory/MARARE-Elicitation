

import React, { useState, useRef, useEffect } from "react";
import { Button, Switch, Dropdown, Avatar, Typography } from "antd";
import {
  UserOutlined,
  MoonOutlined,
  SunOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "../app1/Components/authcontext.jsx";
import supabase from "../app1/Components/supabaseclient.jsx";
import Auth from "../app1/Components/Auth.jsx";
import { useNavigate } from "react-router-dom";
// import AddConnectorModel from "../app2/components/AddConnectorPage.jsx";

const { Text } = Typography;

const Header = ({ isDarkMode, toggleTheme, handler }) => {
  const { user } = useAuth();
  // const [showSignUp, setShowSignUp] = useState(false);
  const imgElement = user?.user_metadata.picture ?? null;
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.log("Error occurred while signout: ", error);
      alert("Error while Signout. Try Again!");
    }
  };

  // const handleButtonClick = (val) => {
  //   setShowSignUp(val);
  // };

  // Profile dropdown menu items
  const profileMenuItems = [
    {
      key: "user-info",
      label: (
        <div className="px-2 py-1">
          <Text strong className="block">
            {user?.user_metadata?.full_name || "User"}
          </Text>
          <Text type="secondary" className="text-sm">
            {user?.email}
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      key:"configurations",
      label: "Configurations",
      onClick: ()=>{setIsModalOpen(true)},
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 relative z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              <button
                onClick={() => {
                  console.log("main button click");

                  navigate("/");
                }}
                style={{ cursor: "pointer" }}
              >
                MARARE
              </button>
            </span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />

            {/* Profile Section */}

            {user ? (
              <Dropdown
                menu={{ items: profileMenuItems }}
                placement="bottomRight"
                arrow
                trigger={["click"]}
              >
                <Button
                  type="text"
                  className="flex items-center justify-center p-1 hover:bg-gray-100 rounded-full"
                >
                  {user.user_metadata?.avatar_url ? (
                    <Avatar
                      src={imgElement}
                      // size={32}
                      className="cursor-pointer  "
                    />
                  ) : (
                    <Avatar
                      icon={<UserOutlined />}
                      // size={32}
                      className="cursor-pointer bg-blue-500"
                    />
                  )}
                </Button>
              </Dropdown>
            ) : (
              <Button
                type="default"
                icon={<UserOutlined />}
                // onClick={() => handleButtonClick(true)}
                onClick={handler}
                className="border-gray-300 ml-2 text-gray-700 hover:border-blue-500 hover:text-blue-500"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>
      {/* <AddConnectorModel
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      /> */}

      {/* Auth Modal */}
      {/* {showSignUp && !user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <Auth handle={handleButtonClick} />
          </div>
        </div>
      )} */}
    </>
  );
};

export default Header;
