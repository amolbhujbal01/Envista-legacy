import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import BaseLayout from '@/layouts/BaseLayout';
import ShinyTeeth from '@/assets/shiny-teeth.png';
import LoginBg from '@/assets/LabLoginBg.png';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import LogoBlack from '@/assets/logo-black.svg';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Link, useNavigate } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { twMerge } from 'tailwind-merge';
import axiosInstance from '@/api/axiosInstance';
import { useToast } from '@/components/ui/use-toast';
import { LoaderIcon } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuthToken } from '@/features/auth/authSlice';
import Helmet from '@/components/Helmet';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

interface FormData {
  email: string;
  password: string;
}

function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/signin', data);
      console.log(response);
      const { token, email, uid } = response.data;

      dispatch(
        setAuthToken({
          accessToken: token.accessToken,
          idToken: token.idToken,
          refreshToken: token.refreshToken,
          email,
          uid,
        })
      );

      toast({
        title: 'Logged in successfully',
        description: 'Redirecting to dashboard',
      });
      console.log(response);
      navigate('/');
    } catch (error: any) {
      const statusCode = error.response?.status;
      console.log(error);
      let message = 'An error occurred';
      if (statusCode === 400) {
        message = 'Incorrect username or password.';
        toast({ title: message });
      } else if (statusCode === 401) {
        message = 'Unauthorized. Please check your credentials.';
        toast({ title: message });
      } else {
        toast({ title: message });
      }
    }
    setIsLoading(false);
  };

  return (
    <BaseLayout hasHeader={false} hasPadding={false} hasSidebar={false}>
      <Helmet title="Login" />
      <section className="grid flex-1 h-full lg:grid-cols-2">
        <div
          className="w-full h-full min-h-[300px] bg-right-top bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${LoginBg})` }}
        ></div>
        <div className="relative grid max-lg:p-12 lg:px-8 place-items-center">
          {/* <img
            className="absolute right-0 -bottom-2 opacity-30 -z-10"
            src={ShinyTeeth}
            alt=""
          /> */}
          <div className="flex flex-col items-center w-full">
            <img className="h-8" src={LogoBlack} alt="Nobel Biocare logo" />
            <span className="relative mt-4 px-2 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 whitespace-nowrap top-1">
              Lab Portal
            </span>
            <Card className="w-full max-w-lg mt-4 shadow">
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="mt-2"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput
                      id="password"
                      {...register('password')}
                      className="mt-2"
                    />
                    {errors.password && (
                      <p className="text-xs text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between !hidden mt-4 sm:items-center max-sm:flex-col">
                    <div>
                      <Checkbox id="remember" />
                      <Label className="ml-2" htmlFor="remember">
                        Remember me
                      </Label>
                    </div>
                    <Link
                      className="text-right text-blue-600 max-sm:mt-4"
                      to="/forgot-password"
                    >
                      Forgot password?{' '}
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className={twMerge(
                      buttonVariants({ variant: 'default' }),
                      'w-full mt-4 flex gap-1'
                    )}
                  >
                    {isLoading && (
                      <LoaderIcon
                        className="animate-spin [animation-duration:3s]"
                        height={18}
                      />
                    )}
                    Login
                  </Button>
                </form>
              </CardContent>
              <CardFooter>
                <p className="w-full text-center">
                  Don't have an account?{' '}
                  <Link className="text-blue-600" to="/register">
                    Register
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </BaseLayout>
  );
}

export default Login;
