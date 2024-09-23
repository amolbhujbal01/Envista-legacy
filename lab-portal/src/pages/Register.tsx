import BaseLayout from '@/layouts/BaseLayout';
import DentistPhoto from '@/assets/login-dentist.jpg';
import ShinyTeeth from '@/assets/shiny-teeth.png';
import LoginBg from '@/assets/LabLoginBg.png';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LogoBlack from '@/assets/logo-black.svg';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { setAuthToken } from '@/features/auth/authSlice';
import axiosInstance from '@/api/axiosInstance';
import { LoaderIcon } from 'lucide-react';
import Helmet from '@/components/Helmet';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  name: yup.string().required('Name is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Password must contain at least one special character'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

interface FormData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:5000';

function Register() {
  const [showOtp, setShowOtp] = useState(false);
  const [tempOtp, setTempOtp] = useState('');
  const [apiError, setApiError] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  const handleRegister = async (data: FormData) => {
    setApiError('');
    setIsLoading(true);
    const { confirmPassword, ...payload } = data;
    try {
      const response = await axiosInstance.post('/api/auth/signup', payload);
      const result = response.data;
      console.log(response);

      if (response.status.toString().startsWith('2')) {
        setShowOtp(true);
      } else {
        setApiError(result.response.error);
      }
    } catch (error) {
      if (error.response) {
        setApiError(error.response.data.error || 'An error occurred');
      } else {
        setApiError('An error occurred');
      }
    }
    setIsLoading(false);
  };

  const handleVerify = async (data: FormData) => {
    setIsLoading(true);
    setApiError('');
    const { password, email } = data;

    try {
      const response = await axiosInstance.post('/api/auth/verify', {
        password,
        email,
        codeEmailVerify: tempOtp,
      });

      const result = response.data;

      if (response.status.toString().startsWith('2')) {
        const { token, email, uid } = result.signInResult.response;
        dispatch(
          setAuthToken({
            accessToken: token.accessToken,
            idToken: token.idToken,
            refreshToken: token.refreshToken,
            email,
            uid,
          })
        );
        setApiError('Verified');
        navigate('/login');
      } else {
        setApiError(result.response.name);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setApiError(error.response.data.error || 'An error occurred');
      } else {
        setApiError('An error occurred');
      }
    }
    setIsLoading(false);
  };

  return (
    <BaseLayout hasHeader={false} hasPadding={false} hasSidebar={false}>
      <Helmet title="Register" />
      <section className="grid flex-1 h-full lg:grid-cols-2">
        <div
          className="w-full h-full min-h-[300px] bg-right-top  bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${LoginBg})` }}
        ></div>
        <div className="relative grid max-lg:p-12 lg:px-8 place-items-center">
          <img
            className="absolute right-0 -bottom-2 opacity-30 -z-10"
            src={ShinyTeeth}
            alt=""
          />
          <div className="flex flex-col items-center w-fit">
            <img className="h-8" src={LogoBlack} alt="Nobel Biocare logo" />
            <span className="relative mt-4 px-2 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 whitespace-nowrap top-1">
              Lab Portal
            </span>
            {!showOtp && (
              <form onSubmit={handleSubmit(handleRegister)}>
                <Card className="w-full max-w-xl mt-8 shadow">
                  <CardHeader>
                    <CardTitle>Create a new account</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          {...register('email')}
                          id="email"
                          type="email"
                          className="mt-2"
                        />
                        <p className="text-xs text-red-600">
                          {errors.email?.message}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          {...register('name')}
                          id="name"
                          type="text"
                          className="mt-2"
                        />
                        <p className="text-xs text-red-600">
                          {errors.name?.message}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                          {...register('password')}
                          id="password"
                          className="mt-2"
                        />
                        <p className="text-xs text-red-600">
                          {errors.password?.message}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">
                          Confirm password
                        </Label>
                        <PasswordInput
                          {...register('confirmPassword')}
                          id="confirmPassword"
                          className="mt-2"
                        />
                        <p className="text-xs text-red-600">
                          {errors.confirmPassword?.message}
                        </p>
                      </div>
                    </div>
                    {apiError && (
                      <p className="mt-4 text-xs text-red-600">{apiError}</p>
                    )}
                    <Button className="w-full mt-8">
                      {isLoading && (
                        <LoaderIcon
                          className="animate-spin [animation-duration:3s]"
                          height={18}
                        />
                      )}
                      Register
                    </Button>
                  </CardContent>
                  <CardFooter>
                    <p className="w-full text-center">
                      Already have an account?{' '}
                      <Link className="text-blue-600" to="/login">
                        Login
                      </Link>
                    </p>
                  </CardFooter>
                </Card>
              </form>
            )}
            {showOtp && (
              <form onSubmit={handleSubmit(handleVerify)}>
                <Card className="mt-8 shadow w-fit">
                  <CardHeader>
                    <CardTitle>Confirm email address</CardTitle>
                    <CardDescription>
                      Enter the OTP sent to your email address
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden">
                      <InputOTP maxLength={6}>
                        <InputOTPGroup>
                          {[0, 1, 2].map((index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              value={otp[index]}
                              onChange={(e) =>
                                handleOtpChange(index, e.target.value)
                              }
                            />
                          ))}
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          {[3, 4, 5].map((index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              value={otp[index]}
                              onChange={(e) =>
                                handleOtpChange(index, e.target.value)
                              }
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Input
                      type="text"
                      className="mt-4"
                      value={tempOtp}
                      onChange={(e) => setTempOtp(e.target.value)}
                    />

                    {apiError && (
                      <p className="mt-4 text-xs text-red-600">{apiError}</p>
                    )}
                    <Button className="w-full mt-8" type="submit">
                      {isLoading && (
                        <LoaderIcon
                          className="animate-spin [animation-duration:3s]"
                          height={18}
                        />
                      )}
                      Verify
                    </Button>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>
        </div>
      </section>
    </BaseLayout>
  );
}

export default Register;
