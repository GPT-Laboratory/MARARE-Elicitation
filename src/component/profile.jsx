import React, { useState, useRef, useEffect } from "react";
import Auth from "../app1/Components/Auth.jsx";
import { useAuth } from "../app1/Components/authcontext.jsx";
import "./profile.css";

// for icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOut } from "@fortawesome/free-solid-svg-icons";
import supabase from "../app1/Components/supabaseclient.jsx";
import { useToggleHook } from "../app1/Components/useToggleHook.jsx";

export default function profile() {
  const userElement = <FontAwesomeIcon icon={faUser} />;
  const Signout = <FontAwesomeIcon icon={faSignOut} />;
  const [showSignUp, setShowSignUp] = useState(false);
  const { user } = useAuth();
  const [showDropdown, setShowDropDown] = useState(false);
  const profileBtnRef = useRef();
  const dropdownRef = useRef();
  const { toggleState } = useToggleHook();
  const imgElement = user?.user_metadata.picture ?? null;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.log("Error occured while signout: ", error);
      alert("Error while Signout. Try Again!");
    }
  };

  function handleButtonClick(val) {
    setShowSignUp(val);
  }

  useEffect(() => {
    const handleWindowClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) && // Click is outside dropdown
        profileBtnRef.current &&
        !profileBtnRef.current.contains(event.target) // Click is outside profile button
      ) {
        setShowDropDown(false); // Close dropdown
      }
    };

    if (showDropdown) {
      window.addEventListener("click", handleWindowClick);
    }

    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, [showDropdown]);
  return (
    <>
      {/* toogle the button and component by conditional rendering */}
      <div className="profile-container">
      <div className="element">
        {!showSignUp && !user && (
          <button
            className=" beforebtn"
            onClick={() => {
              handleButtonClick(true);
            }}
          >
            Sign Up/Log in
          </button>
        )}
        {!showSignUp && user && (
          <div>
            <button
              className="btn btnflex"
              ref={profileBtnRef}
              onClick={() => {
                setShowDropDown(!showDropdown);
              }}
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={imgElement}
                  alt="profile"
                  className="w-8 h-8 rounded-full object-cover profileimg"
                />
              ) : (
                { userelement: userElement }
              )}
            </button>
            {showDropdown && (
              <div className="dropdown-content " ref={dropdownRef}>
                <div className="user-info">
                  <p className="user-name">
                    {user.user_metadata?.full_name || "User"}
                  </p>
                  <p className="user-email">{user.email}</p>
                </div>
                <div className="line"></div>

                <button onClick={handleLogout} className="logout-button">
                  {Signout}
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
        {showSignUp && <Auth handle={handleButtonClick} />}
      </div>
      </div>
    </>
  );
}
