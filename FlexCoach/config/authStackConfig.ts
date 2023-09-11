import { ForgotPasswordScreen } from "../screens/Auth/screens/ForgotPasswordScreen";
import { SignInScreen } from "../screens/Auth/screens/SignInScreen";
import { SignUpScreen } from "../screens/Auth/screens/SignUpScreen";

export const authStack = [
    {
        id: 'SignInScreen',
        name: 'Sign In',
        component: SignInScreen,
    },
    {
        id: 'SignUpScreen',
        name: 'Sign Up',
        component: SignUpScreen
    },
    {
        id: 'ForgotPasswordScreen',
        name: 'Reset Your Password',
        component: ForgotPasswordScreen
    }
]