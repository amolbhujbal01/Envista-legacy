import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import axiosInstance from '@/api/axiosInstance';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import BaseLayout from '@/layouts/BaseLayout';
import { Label } from '@/components/ui/label';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { Check, ChevronsUpDown, LoaderIcon } from 'lucide-react';
import Helmet from '@/components/Helmet';
import { Textarea } from '@/components/ui/textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  start_date: yup.date().required('Estimated start date is required'),
  end_date: yup.date().required('Estimated end date is required'),
  clinical_notes: yup.string().required('Clinical Notes are required'),
  workflow_id: yup.string().required('Workflow is required'),
});

interface WorkflowOptions {
  label: string;
  value: string;
}

interface Workflow {
  workflow_id: number;
  name: string;
  description: string;
  conditionsTreated: string;
  duration: number;
  noOfStages: number;
  status: string;
  created_at: string;
}

export default function JourneyCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [workflowOptions, setWorkflowOptions] = useState<WorkflowOptions[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await axiosInstance.get('/api/workflows');
        const workflows = response.data.data.map((workflow: Workflow) => ({
          value: workflow.workflow_id.toString(),
          label: workflow.name,
        }));
        setWorkflowOptions(workflows);
      } catch (error) {
        console.error('Error fetching workflows:', error);
      }
    };

    fetchWorkflows();
  }, []);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await axiosInstance.post(
        `/api/treatmentjourneys/createTreatmentJourney/${id}`,
        data
      );
      navigate(`/patients/${id}`);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseLayout>
      <Helmet title="Add new patient" />
      <div className="flex justify-between gap-4 lg:items-center max-lg:flex-col">
        <h1 className="flex-1 text-3xl font-bold md:text-5xl">
          Create New Treatment Journey
        </h1>
        <div className="flex items-center gap-4">
          <Link
            to={`/patients/${id}`}
            className={twMerge(buttonVariants({ variant: 'ghost' }))}
          >
            Back
          </Link>
          <Button
            disabled={isLoading}
            type="submit"
            form="patientForm"
            variant="default"
          >
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

      <form
        id="patientForm"
        className="grid mt-8 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        {' '}
        <div>
          <Label htmlFor="workflow" className="block">
            Journey Template
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="mt-2" asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between w-full"
              >
                <div className="overflow-hidden font-thin truncate text-ellipsis">
                  {selectedWorkflow
                    ? workflowOptions.find(
                        (wf) => wf.value === selectedWorkflow
                      )?.label
                    : 'Select workflow...'}
                </div>
                <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-3/4 p-0 mx-auto">
              <Command>
                <CommandInput placeholder="Search workflow..." />
                <CommandEmpty>No workflow found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {workflowOptions.map((wf) => (
                      <CommandItem
                        key={wf.value}
                        value={wf.value}
                        onSelect={(currentValue) => {
                          setSelectedWorkflow(currentValue);
                          setValue('workflow_id', currentValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedWorkflow === wf.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {wf.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {errors.workflow_id && (
            <p className="text-xs text-red-600">{errors.workflow_id.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="start_date">Estimated Start Date</Label>
          <Input id="start_date" type="date" {...register('start_date')} />
          {errors.start_date && (
            <p className="text-xs text-red-600">{errors.start_date.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="end_date">Estimated End Date</Label>
          <Input id="end_date" type="date" {...register('end_date')} />
          {errors.end_date && (
            <p className="text-xs text-red-600">{errors.end_date.message}</p>
          )}
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <Label htmlFor="clinical_notes">Clinical Notes</Label>
          <Textarea id="clinical_notes" {...register('clinical_notes')} />
          {errors.clinical_notes && (
            <p className="text-xs text-red-600">
              {errors.clinical_notes.message}
            </p>
          )}
        </div>
      </form>
    </BaseLayout>
  );
}
