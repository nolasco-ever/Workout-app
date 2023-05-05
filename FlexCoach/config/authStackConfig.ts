import { ForgotPasswordScreen } from "../screens/Auth/screens/ForgotPasswordScreen";
import { SignInScreen } from "../screens/Auth/screens/SignInScreen";
import { SignUpScreen } from "../screens/Auth/screens/SignUpScreen";

export const authStack = [
    {
        id: 'signInScreen',
        name: 'Sign In',
        component: SignInScreen,
    },
    {
        id: 'signUpScreen',
        name: 'Sign Up',
        component: SignUpScreen
    },
    {
        id: 'forgotPasswordScreen',
        name: 'Reset Your Password',
        component: ForgotPasswordScreen
    }
]