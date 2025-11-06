import { useState, useRef, useEffect } from "react";
import { Button, Input, Form, Typography, Divider, Space} from "antd";
import { GoogleOutlined, CloseOutlined, LeftOutlined } from "@ant-design/icons";
import supabase from "./supabaseclient";
import PropTypes from "prop-types";
import { ThreeCircles } from "react-loader-spinner";
import { useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';

const { Title, Text } = Typography;

export default function Auth(props) {
  // all variables and hooks
  const navigate = useNavigate();
  const location = useLocation();
  console.log("location 2", location);
  const { from } = location.state || { from: { pathname: "/" } };
  console.log("meeting id", from);
  const {enqueueSnackbar} = useSnackbar();
    const giveSuccessNotification =  (message)=>{
      enqueueSnackbar(message, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'left' },
        autoHideDuration: 2000,
      })
  }
   const giveWarnNotification =  (message)=>{
      enqueueSnackbar(message, {
        variant: "warning",
        anchorOrigin: { vertical: 'top', horizontal: 'left' },
        autoHideDuration: 2000,
      })
  }

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    localStorage.setItem("redirectAfterLogin", from.pathname);
  }, [from]);

  const spinner = (
    <ThreeCircles
      visible={true}
      height="20"
      width="20"
      color="white"
      ariaLabel="three-circles-loading"
      wrapperStyle={{}}
      wrapperClass=""
    />
  );

  // to close authenticate component
  // const clsfunc = () => {
  //   props.handle(false);
  // };

  // button reference
  // const buttonref = useRef();

  // hiding cls button

  // const hide = props.hideBtn;
  // useEffect(() => {
  //   if (hide) {
  //     buttonref.current.style.display = "none";
  //   }
  // }, [hide]);
  
  const backHandler = ()=>{
    console.log("Back button clicked");
    
      navigate(from.pathname)
  }


  const signupProp = props.isSignup;
  console.log("Signup Prop", signupProp);

  useEffect(() => {
    if (signupProp) {
      setIsSignUp(true);
    }
  }, [signupProp]);



  const handleAuth = async (values) => {
    setLoading(true);
    setError(null);

    try {
      let authError = null;

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });
        authError = error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        authError = error;
      }

      if (authError) throw authError;

      // Update login state in App
      if (props.setIsLoggedIn) {
        props.setIsLoggedIn(true);
      }

      // Redirect after login/signup
      const redirectAfterLogin =
        localStorage.getItem("redirectAfterLogin") || "/";
      localStorage.removeItem("redirectAfterLogin");
      navigate(redirectAfterLogin);
    } catch (error) {
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      localStorage.setItem("redirectAfterLogin", from.pathname);

      const redirectAfterLogin =
        localStorage.getItem("redirectAfterLogin") ?? null;

      console.log("Redirecting to:", redirectAfterLogin);
      console.log(redirectAfterLogin);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectAfterLogin}`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message || "An error occurred during OAuth login");
    }
  };

  const handleForgetPassword = async () => {
    console.log("Forget password clicked");
    setLoading(true);
    setError(null);

    const emailValue = form.getFieldValue("email");
    if (!emailValue) {
      giveWarnNotification("Please enter your email to reset password.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      setLoading(false);
      giveSuccessNotification("Check your email for password reset link.");
      if (error) throw error;
    } catch (error) {
      setError(error.message || "An error occurred");
    }
  };

  

  return (
    <>
      <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-30 pt-20">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative">
          {/* Close button */}
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={backHandler}
            className="absolute top-4 right-4 text-gray-500"
          />

          {/* Title */}
          <div className="text-center mb-8">
            <Title
              level={2}
              className="!mb-0 !text-2xl !font-bold !text-gray-900"
            >
              {isSignUp ? "Create Your Account" : "Sign in to your account"}
            </Title>
          </div>

          {/* Form */}
          <Form
            form={form}
            onFinish={handleAuth}
            layout="vertical"
            className="space-y-6"
          >
            <Form.Item
              name="email"
              label={
                <span className="text-base font-medium text-gray-900">
                  Email
                </span>
              }
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                size="large"
                className="!h-12 !rounded-lg !border-gray-300"
                placeholder=""
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span className="text-base font-medium text-gray-900">
                  Password
                </span>
              }
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                size="large"
                className="!h-12 !rounded-lg !border-gray-300"
                placeholder=""
              />
            </Form.Item>

            {/* Error message */}
            {error && (
              <div className="text-red-500 text-sm text-center mb-4">
                {error}
              </div>
            )}

            {/* Sign up button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="!w-full !h-12 !rounded-lg !bg-blue-600 !border-blue-600 hover:!bg-blue-700 !text-base !font-medium"
              >
                {loading ? spinner : isSignUp ? "Sign up" : "Sign in"}
              </Button>
            </Form.Item>
          </Form>

          {/* Forget Password */}
          <div className="text-center mb-6">
            <Button
              type="link"
              onClick={handleForgetPassword}
              className="!text-blue-600 !p-0 !h-auto !text-base hover:!text-blue-700"
            >
              Forget Password?
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <Button
            onClick={() => handleOAuth("google")}
            size="large"
            className="!w-full !h-12 !rounded-lg !border-gray-300 hover:!border-gray-400 !text-base !font-medium !text-gray-700 !bg-white hover:!bg-gray-50 !flex !items-center !justify-center !gap-3"
          >
            <GoogleOutlined className="!text-lg" />
            Continue with google
          </Button>

          {/* Toggle Sign in/Sign up */}
          <div className="text-center mt-6">
            <Button
              type="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
              }}
              className="!text-blue-600 !p-0 !h-auto !text-base hover:!text-blue-700"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

Auth.propTypes = {
  handle: PropTypes.func,
  hideBtn: PropTypes.node,
  setIsLoggedIn: PropTypes.func,
  isSignup: PropTypes.node.isRequired,
};
