import BaseLayout from '@/layouts/BaseLayout';
import DentistPhoto from '@/assets/login-dentist.jpg';
import ShinyTeeth from '@/assets/shiny-teeth.png';
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
import { Button } from '@/components/ui/button';

function ForgotPassword() {
  return (
    <BaseLayout hasHeader={false} hasPadding={false} hasSidebar={false}>
      <section className="grid flex-1 h-full lg:grid-cols-2">
        <div
          className="w-full h-full  min-h-[300px] bg-right-top  bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${DentistPhoto})` }}
        ></div>
        <div className="relative grid place-items-center max-lg:p-12 lg:px-8">
          <img
            className="absolute right-0 -bottom-2 opacity-30 -z-10"
            src={ShinyTeeth}
            alt=""
          />
          <div className="flex flex-col items-center w-full">
            <img className="h-8" src={LogoBlack} alt="Nobel Biocare logo" />
            <Card className="w-full max-w-lg mt-8 shadow">
              <CardHeader>
                <CardTitle>Recover your password</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    name="email"
                    id="email"
                    type="email"
                    className="mt-2"
                  />
                </div>
                <Button className="w-full mt-8">Continue</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </BaseLayout>
  );
}

export default ForgotPassword;
