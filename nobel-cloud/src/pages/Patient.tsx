import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { AvatarFallback, Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import BaseLayout from '@/layouts/BaseLayout';
import { EyeOffIcon, EyeIcon, MailIcon, PhoneIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { getInitials } from '@/lib/utils';
import Helmet from '@/components/Helmet';
import { censorText } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PatientDetails {
  patient_id: number;
  tenant_id: string;
  dental_practice_id: number;
  practice_id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  date_of_birth: string;
  pms_id: string;
  ssn: string;
}

interface TreatmentJourney {
  treatment_journey_id: number;
  tenant_id: string;
  workflow_id: number;
  patient_id: number;
  dental_practice_id: number;
  status: string;
  start_date: string;
  end_date: string;
  priority?: string;
  clinical_notes: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const columns = [
  {
    header: 'filename',
    accessorKey: 'Filename',
    id: 'filename',
  },
  {
    header: 'Clinician',
    accessorKey: 'Clinician',
    id: 'Clinician',
  },
  {
    header: 'Uploaded in Journey',
    accessorKey: 'treatment_journey_name',
    id: 'treatment_journey_name',
  },
  {
    header: 'Uploaded at Stage',
    accessorKey: 'stage_name',
    id: 'stage_name',
  },
  {
    header: 'Uploaded in Step',
    accessorKey: 'step_name',
    id: 'step_name',
  },
];

const formatReadableDate = (dateString: string): string => {
  if (!dateString) return '';
  return format(new Date(dateString), 'MMMM d, yyyy');
};
export default function Patient() {
  const { id } = useParams();
  const [censored, setCensored] = useState(true);
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    patient_id: 0,
    tenant_id: '',
    dental_practice_id: 0,
    practice_id: 0,
    name: '',
    email: '',
    phone: '',
    gender: '',
    address: '',
    date_of_birth: '',
  });
  const [treatmentJourneys, setTreatmentJourneys] = useState<
    TreatmentJourney[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryData, setLibraryData] = useState<Object[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/api/patient/${id}`);
        setPatientDetails(response.data);
      } catch (error) {
        console.error('Error fetching patient details:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTreatmentJourneys = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/api/treatmentjourneys/${id}`
        );
        setTreatmentJourneys(response.data);
      } catch (error) {
        console.error('Error fetching treatment journeys:', error);
        setError('Error fetching treatment journeys');
      } finally {
        setLoading(false);
      }
    };

    const fetchImageLibrary = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/api/filesaction/image-repository/${id}`
        );
        setLibraryData(response.data);
      } catch (error) {
        console.error('Error fetching treatment journeys:', error);
        setError('Error fetching treatment journeys');
      } finally {
        setLoading(false);
      }
    };
    fetchImageLibrary();
    fetchPatientDetails();
    fetchTreatmentJourneys();
  }, [id]);

  const viewJourney = async (journeyId: number, toBeStarted: boolean) => {
    if (toBeStarted) {
      const response = await axiosInstance.get(
        `/api/treatmentjourneys/start-journey/${journeyId}`
      );
      console.log(response);
    }
    navigate(`/journey/${id}/${journeyId}`);
  };

  return (
    <BaseLayout>
      <Helmet title="Patient Details" />
      <div className="flex justify-between gap-4 lg:items-center max-lg:flex-col ">
        <h1 className="flex-1 text-3xl font-bold md:text-5xl">
          {censorText(patientDetails?.name, censored, 2)}
        </h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setCensored((prev) => !prev)}>
            {censored ? <EyeIcon /> : <EyeOffIcon />}
          </Button>
          <Link
            to="/patients/add"
            className={twMerge(buttonVariants({ variant: 'default' }))}
          >
            Edit Details
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="hidden px-8 py-0.5 text-white bg-green-600 rounded-t-md w-fit">
          Active
        </div>
        <div className="flex justify-between p-6 rounded-lg bg-slate-100">
          <div className="flex gap-8 max-lg:flex-col">
            <Avatar className="w-28 h-28">
              <AvatarImage
                src={
                  patientDetails?.gender?.toLowerCase() === 'female'
                    ? '/female.jpg'
                    : '/male.jpg'
                }
              />
              <AvatarFallback className="text-xl lg:text-3xl bg-slate-300">
                {getInitials(patientDetails?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>
                <strong>Gender: </strong>
                <span className="capitalize">
                  {censorText(patientDetails?.gender, censored)}
                </span>
              </div>
              <div>
                <strong>DoB: </strong>
                <span>
                  {censorText(
                    formatReadableDate(patientDetails?.date_of_birth),
                    censored
                  )}
                </span>
              </div>
              <div className="md:hidden">
                <strong>Total Treatment Journeys: </strong>
                <span>{treatmentJourneys.length}</span>
              </div>
              <div>
                <strong>PMS ID: </strong>
                <span>
                  {patientDetails?.pms_id?.toString()}
                </span>
              </div>
              <div>
                <strong>Address: </strong>
                <span>{censorText(patientDetails?.address, censored)}</span>
              </div>
              <div className="flex gap-4 mt-4">
                <Link
                  to={censored ? '#' : `tel:${patientDetails?.phone}`}
                  className={twMerge(buttonVariants({ variant: 'default' }))}
                >
                  <PhoneIcon height={18} className="mr-2" />
                  {censorText(patientDetails?.phone, censored)}
                </Link>
                <Link
                  to={censored ? '#' : `mailto:${patientDetails?.email}`}
                  className={twMerge(buttonVariants({ variant: 'default' }))}
                >
                  <MailIcon height={18} className="mr-2" />
                  {censorText(patientDetails?.email, censored)}
                </Link>
              </div>
            </div>
          </div>
          {!!treatmentJourneys.length && (
            <div className="flex flex-col items-center w-full p-6 text-center rounded-lg max-w-64 bg-slate-200 h-fit max-md:hidden">
              <span className="text-5xl font-bold">
                {treatmentJourneys.length}
              </span>
              <span className="mt-2">
                {`Total Treatment Journey${treatmentJourneys.length === 1 ? '' : 's'}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <h3 className="text-2xl font-bold md:text-3xl">Treatment Journeys</h3>
        <Link
          to={`/patients/new-journey/${id}`}
          className={twMerge(buttonVariants({ variant: 'default' }))}
        >
          New Treatment Journey
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {treatmentJourneys.map((journey, index) => (
          <div className="mt-4" key={index}>
            <div className="px-4 py-1 text-xs text-white bg-slate-500 rounded-t-md w-fit">
              {journey.name}
            </div>
            <div className="grid gap-4 rounded-lg rounded-tl-none ">
              <div
                key={journey.id}
                className="flex flex-col p-2 border-2 rounded-md rounded-tl-none"
              >
                {journey.status === 'Pending' && (
                  <span className="px-3 py-1 text-xs bg-orange-300 rounded-full w-fit">
                    Pending
                  </span>
                )}
                {journey.status === 'IN_PROGRESS' && (
                  <span className="px-3 py-1 text-xs bg-orange-300 rounded-full w-fit">
                    In Progress
                  </span>
                )}
                {journey.status === 'NOT_STARTED' && (
                  <span className="px-3 py-1 text-xs bg-red-300 rounded-full w-fit">
                    Not Started
                  </span>
                )}
                {journey.status === 'COMPLETED' && (
                  <span className="px-3 py-1 text-xs bg-green-300 rounded-full w-fit">
                    Completed
                  </span>
                )}

                <h3 className="mt-2 font-bold">{journey?.workflow_name}</h3>

                <div className="text-sm">
                  Created On:{' '}
                  <span>{format(journey?.created_at, 'dd MMM yyyy')}</span>{' '}
                </div>
                <div className="text-sm">
                  Updated On:{' '}
                  <span>{format(journey?.updated_at, 'dd MMM yyyy')}</span>{' '}
                </div>
                <Button
                  onClick={() =>
                    viewJourney(
                      journey.treatment_journey_id,
                      journey.status === 'NOT_STARTED'
                    )
                  }
                  className={twMerge(
                    buttonVariants({ variant: 'secondary' }),
                    'mt-4'
                  )}
                >
                  {journey.status === 'NOT_STARTED' ? 'Start Journey' : 'View'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div>
        {!treatmentJourneys.length && (
          <div className="mt-2 text-center">No data to display.</div>
        )}
      </div>

      <div>
        <h3 className="mt-8 text-2xl font-bold md:text-3xl ">Image Library</h3>
        {libraryData && !!libraryData?.length ? (
          <div className="overflow-y-auto max-h-[300px] py-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded in Journey</TableHead>
                  <TableHead>Uploaded at Stage</TableHead>
                  <TableHead>Uploaded in Step</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraryData.map((image, index) => (
                  <TableRow
                    className="transition-colors duration-300 cursor-pointer hover:bg-neutral-100"
                    key={index}
                  >
                    <TableCell className="truncate max-w-[200px]">
                      {image?.filename}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {image?.treatment_journey_name}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {image?.stage_name}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {image?.step_name}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {format(image?.created_date, 'dd MMM yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-2 text-center">No data to display.</div>
        )}
      </div>
    </BaseLayout>
  );
}
