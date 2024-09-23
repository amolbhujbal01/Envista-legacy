import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import BaseLayout from '@/layouts/BaseLayout';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axiosInstance from '@/api/axiosInstance';
import { toast } from '@/components/ui/use-toast';
import { LoaderIcon } from 'lucide-react';
import { useState } from 'react';
import Helmet from '@/components/Helmet';

const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  dob: yup.date().nullable().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  pmsId: yup.string().required('PMS ID is required'),
});

export default function PatientCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      dob: '',
      gender: '',
    },
  });

  const onSubmit = async (data) => {
    const formattedData = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      address: data.address,
      pms_id: data.pmsId,
      date_of_birth: data.dob,
      ssn: null,
    };
    console.log(formattedData);
    setIsLoading(true);

    try {
      const response = await axiosInstance.post(
        '/api/patient/createPatient',
        formattedData
      );
      console.log('Patient created successfully:');
      toast({ title: response.data });
      setIsLoading(false);
      navigate('/patients');
    } catch (error) {
      console.error('Error creating patient:', error);
    }
    setIsLoading(false);
  };

  return (
    <BaseLayout>
      <Helmet title="Add new patient" />
      <div className="flex justify-between gap-4 lg:items-center max-lg:flex-col">
        <h1 className="flex-1 text-3xl font-bold md:text-5xl">
          Create New Patient
        </h1>
        <div className="flex items-center gap-4">
          <Link
            to="/patients"
            className={twMerge(buttonVariants({ variant: 'ghost' }))}
          >
            Back
          </Link>
          <Button type="submit" form="patientForm" variant="default">
            {isLoading && (
              <LoaderIcon
                className="animate-spin [animation-duration:3s]"
                height={18}
              />
            )}
            Save
          </Button>
        </div>
      </div>

      <form id="patientForm" onSubmit={handleSubmit(onSubmit)} className="mt-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <Input {...field} id="firstName" type="text" className="mt-2" />
              )}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <Input {...field} id="lastName" type="text" className="mt-2" />
              )}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email address</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input {...field} id="email" type="email" className="mt-2" />
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input {...field} id="phone" type="text" className="mt-2" />
              )}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>{' '}
          <div>
            <Label htmlFor="pmsId">PMS ID</Label>
            <Controller
              name="pmsId"
              control={control}
              render={({ field }) => (
                <Input {...field} id="pmsId" type="text" className="mt-2" />
              )}
            />
            {errors.pmsId && (
              <p className="text-xs text-red-500">{errors.pmsId.message}</p>
            )}
          </div>{' '}
          <div className="flex flex-col justify-start gap-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <Input {...field} id="dob" type="date" className="mt-2" />
              )}
            />
            {errors.dob && (
              <p className="text-xs text-red-500">{errors.dob.message}</p>
            )}
          </div>
          <div className="flex flex-col justify-start gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => setValue('gender', value)}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p className="text-xs text-red-500">{errors.gender.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <Input {...field} id="address" type="text" className="mt-2" />
              )}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>
        </div>
      </form>
    </BaseLayout>
  );
}
