import { useEffect, useRef, useState } from 'react';
import Helmet from '@/components/Helmet';
import { Button } from '@/components/ui/button';
import BaseLayout from '@/layouts/BaseLayout';
import {
  CheckIcon,
  ChevronLeftIcon,
  CogIcon,
  DownloadIcon,
  InfoIcon,
  LibraryIcon,
  LoaderIcon,
  ShoppingCartIcon,
  UploadIcon,
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { calculateAge, cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TreatmentPlanProcedure {
  treatment_plan_action_id: number;
  procedure_id: number;
  procedure_action_id: number;
  procedure_action_name: string;
  isMentorReviewRequired?: boolean | 1 | 0;
  isApproveRequired?: boolean | 1 | 0;
  isUploadRequired?: boolean | 1 | 0;
  isSendToLab?: boolean | 1 | 0;
  isDownloadRequired?: boolean | 1 | 0;
  isOrderConsumables?: boolean | 1 | 0;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface StepData {
  workflow_id: number;
  treatment_plan_stage_id?: number;
  treatment_plan_stage_item_id?: number;
  next_treatment_plan_stage_item_id?: number;
  stage_description?: string;
  stage_item_description?: string;
  stage_item_name?: string;
  stage_name?: string;
  treatment_plan_procedure: TreatmentPlanProcedure[];
}

interface TreatmentJourney {
  treatment_journey_id: number;
  patient_id: number;
  workflow_id: number;
  description: string;
  workflow_name: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  priority: string | null;
  clinical_notes: string;
  stages: Stage[];
  completion_percentage: number;
}

interface Stage {
  name: string;
  description: string;
  steps: Step[];
  skippable: boolean;
  status: string;
  isSkipped: boolean;
  treatment_plan_stage_id: number;
}

interface Step {
  name: string;
  description: string;
  status: string;
  treatment_plan_stage_item_id: number;
}

interface LibraryImage {
  Clinician: string;
  filename: string;
  image_repository_id: number;
  stage_name: string;
  step_name: string;
  treatment_journey_id: number;
  treatment_journey_name: string;
  treatment_plan_action_id: number;
  treatment_plan_stage_id: number;
  treatment_plan_stage_item_id: number;
  version_id: number | null;
  workflow_id: number;
  workflow_name: string;
}

const faqs = [
  {
    question:
      'What is the recovery time after a full arch dental implant procedure?',
    answer:
      'The initial recovery period typically lasts about 1 to 2 weeks, during which patients may experience some swelling, bruising, and discomfort. However, the complete healing process, known as osseointegration, where the implants fully fuse with the jawbone, can take 3 to 6 months. During this time, a temporary prosthesis may be used until the final, permanent prosthesis is placed.',
  },
  {
    question: 'How long do full arch dental implants last?',
    answer:
      'Full arch dental implants are designed to be a long-term solution and can last 15 to 25 years or more with proper care. The implants themselves, which are made of titanium, can last a lifetime, while the prosthetic teeth may need to be replaced or adjusted over time depending on wear and tear. Regular dental check-ups and good oral hygiene are essential to maximize the lifespan of the implants.',
  },
  {
    question: 'Are full arch dental implants suitable for everyone?',
    answer:
      'Full arch dental implants are suitable for most patients, particularly those who have lost multiple teeth or are at risk of losing all their teeth. However, adequate bone density in the jaw is required to support the implants. Patients with certain medical conditions or insufficient bone may need additional treatments, such as bone grafting, before they can proceed with implants.',
  },
  {
    question: 'How many implants are needed for a full arch restoration?',
    answer:
      "A full arch restoration typically requires 4 to 6 dental implants to support a full set of prosthetic teeth. The exact number of implants depends on factors such as bone density, the patient's oral health, and the specific treatment plan recommended by the dentist.",
  },
  {
    question: 'What is the cost of full arch dental implants?',
    answer:
      "The cost of full arch dental implants can vary significantly based on factors such as the number of implants required, the type of prosthetic teeth used, and any additional procedures like bone grafting. On average, full arch implants can range from $20,000 to $50,000 per arch. It's essential to consult with a dental professional for an accurate estimate tailored to your specific needs.",
  },
];

const consumables = [
  {
    name: 'NobelParallel Conical Connection TiUltra NP 3.72 x 10 mm',
    article: '300297',
    image: '/consumables/300297.png',
  },
  {
    name: 'NobelParallel Conical Connection TiUltra NP 3.72 x 11.5 mm',
    article: '300298',
    image: '/consumables/300298.png',
  },
  {
    name: 'NobelParallel Conical Connection TiUltra NP 3.72 x 13 mm',
    article: '300299',
    image: '/consumables/300299.png',
    addedToCart: true,
  },
  {
    name: 'NobelZygoma 45° 32.2 mm',
    article: '38284',
    image: '/consumables/38284.png',
  },
  {
    name: 'NobelZygoma 45° 32.2 mm',
    article: '38285',
    image: '/consumables/38285.png',
  },
  {
    name: 'NobelZygoma 45° 32.2 mm',
    article: '38286',
    image: '/consumables/38286.png',
    addedToCart: true,
  },
  {
    name: 'Multi-unit Abutment Xeal Conical Connection WP 3.5mm',
    article: '300179',
    image: '/consumables/300179.png',
    addedToCart: true,
  },
  {
    name: 'Multi-unit Abutment Xeal Conical Connection WP 3.5mm',
    article: '300180',
    image: '/consumables/300180.png',
  },
  {
    name: '17° Multi-unit Abutment Xeal Conical Connection NP 2.5 mm',
    article: '300181',
    image: '/consumables/300181.png',
    addedToCart: true,
  },
  {
    name: '17° Multi-unit Abutment Xeal Conical Connection NP 2.5 mm',
    article: '300182',
    image: '/consumables/300182.png',
  },
  {
    name: '17° Multi-unit Abutment Xeal Conical Connection NP 2.5 mm',
    article: '300183',
    image: '/consumables/300183.png',
  },
];

const labStatuses = [
  {
    title: 'Sent to Lab',
    status: 'NOT_STARTED',
    handle: 'pending',
  },
  {
    title: 'In progress',
    status: 'NOT_STARTED',
    handle: 'design_phase',
  },
  {
    title: 'Shipped',
    status: 'NOT_STARTED',
    handle: 'shipped',
  },
];

interface ImageAction {
  actionId: number;
  imageId: number;
  imageName: string;
}

export default function Journey() {
  const navigate = useNavigate();
  const [labStatus, setLabStatus] = useState('');
  const [action, setAction] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [journeyData, setJourneyData] = useState<TreatmentJourney | null>(null);
  const [stepData, setStepData] = useState<StepData | null>(null);
  const [pageIsLoading, setPageIsLoading] = useState(false);
  const [buttonIsLoading, setButtonIsLoading] = useState(false);
  const { patientId, journeyId } = useParams();
  const [pageToShow, setPageToShow] = useState('PLAN');
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const [stageId, setStageId] = useState(0);
  const [stepId, setStepId] = useState(0);
  const [stageName, setStageName] = useState<string | null>('');
  const [stepName, setStepName] = useState<string | null>('');
  const [uploadProgress, setUploadProgress] = useState<{
    [key: number]: number;
  }>({});
  const [uploadCompleted, setUploadCompleted] = useState<{
    [key: number]: boolean;
  }>({});
  const [selectedFileName, setSelectedFileName] = useState<Object[]>([]);
  const [selectedImageName, setSelectedImageName] = useState<ImageAction[]>([]);
  const [libraryModalIsOpen, setLibraryModalIsOpen] = useState(false);
  const [libraryData, setLibraryData] = useState<LibraryImage[] | null>(null);
  const [actionIndex, setActionIndex] = useState(0);
  const [actionId, setActionId] = useState(0);
  const [mainTimelineItems, setMainTimelineItems] = useState<TimelineItem[]>(
    []
  );
  const [isCompleteButtonDisabled, setIsCompleteButtonDisabled] =
    useState(false);
  const [orderNote, setOrderNote] = useState('');

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName((prevNames) => ({
        ...prevNames,
        [index]: {
          fileName: file.name,
          type: 'upload',
        },
      }));
    }
  };

  const fetchStepData = async (stepId: number) => {
    setPageIsLoading(true);
    if (stepId.toString() === '-1') {
      setPageToShow('PLAN');
    } else {
      const response = await axiosInstance.get(
        `/api/treatmentjourneys/step/${patientId}?step_id=${stepId}&journey_id=${journeyId}`
      );
      setStepData(response.data);
      setStepId(response?.data?.treatment_plan_stage_item_id);
      setStageId(response?.data?.treatment_plan_stage_id);
      setStageName(response?.data?.stage_name);
      setStepName(response?.data?.stage_item_name);
      console.log(stepData);
      console.log('fetched data', stepId);
      handleLabStatus(stepId);
    }
    setPageIsLoading(false);
  };

  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        const response = await axiosInstance.get(`/api/patient/${patientId}`);
        setPatientData(response?.data);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };
    fetchPatientsData();
  }, [journeyData]);

  const fetchJourneyData = async () => {
    setPageIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/treatmentjourneys/getpatientjourneyplan/${patientId}/${journeyId}`
      );
      console.log(response);
      setJourneyData(response.data);
    } catch (error) {
      console.error('Error fetching journey data:', error);
    } finally {
      setPageIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneyData();
  }, []);

  const fetchTimelineItems = async () => {
    setPageIsLoading(true);
    const items: TimelineItem[] = [];
    if (journeyData === null) setMainTimelineItems([]);
    if (journeyData?.stages)
      journeyData?.stages.map((stage) =>
        items.push({
          title: stage.name,
          status: stage.status,
        })
      );
    setMainTimelineItems(items);
    setPageIsLoading(false);
  };

  useEffect(() => {
    fetchTimelineItems();
  }, [journeyData]);

  const cogClicked = (stage: Stage, step: Step) => {
    console.log(step);
    setSelectedImageName([]);
    setPageIsLoading(true);
    fetchStepData(step.treatment_plan_stage_item_id);
    console.log(stage);
    setStageId(stageId);
    setPageToShow('STEP');
    fetchJourneyData();
    setPageIsLoading(false);
  };

  const kpis = [
    { heading: `${journeyData?.stages.length}`, subheading: 'Stages' },
    {
      heading: `${journeyData?.duration || '2'} months`,
      subheading: 'Estimated duration',
    },
    { heading: `$25000`, subheading: 'Estimated cost' },
    {
      heading: `${parseInt(journeyData?.completion_percentage)}%`,
      subheading: 'Completion rate',
    },
  ];

  const handleBackButton = () => {
    setPageIsLoading(true);
    if (pageToShow === 'PLAN') navigate(`/patients/${patientId}`);
    else {
      fetchJourneyData();
      setUploadProgress({});
      setUploadCompleted({});
      setSelectedFileName([]);
      setPageToShow('PLAN');
    }
    setPageIsLoading(false);
  };

  const uploadFiles = async () => {
    setButtonIsLoading(true);
    setUploadCompleted({});

    try {
      const selectionPromises = Object.values(selectedImageName).map(
        async (image) => {
          try {
            const response = await axiosInstance.post(
              `/api/filesaction/image-repository/${image.actionId}`,
              {
                image_repository_id: image.imageId,
                patient_id: patientId,
                treatment_plan_stage_item_id: stepId,
              }
            );
            console.log(response.data.message);
          } catch (error) {
            console.log(error);
            throw error;
          }
        }
      );

      const uploadPromises = fileInputs.current.flatMap((input, index) => {
        if (!input || !input.files) return [];

        const actionId = input.getAttribute('data-action-id');
        return Array.from(input.files).map(async (file) => {
          try {
            const bodyForPresignedUrl = {
              filename: file.name,
              fileType: file.type || 'application/octet-stream',
              patient_id: patientId,
              journey_id: journeyId,
              workflow_id: journeyData.workflow_id,
              stage_id: stageId,
              step_id: stepId,
              action_id: actionId,
            };

            const getPresignedUrl = await axiosInstance.post(
              '/api/filesaction/generate-presigned-url/',
              bodyForPresignedUrl
            );

            const { fullFilename, presignedUrl } = getPresignedUrl.data;

            await axios.put(presignedUrl, file, {
              headers: {
                'Content-Type': file.type || 'application/octet-stream',
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress((prev) => ({
                  ...prev,
                  [index]: percentCompleted,
                }));
              },
            });

            await axiosInstance.post('/api/filesaction/upload-success', {
              filename: fullFilename,
              patient_id: patientId,
              step_id: stepId,
              action_id: actionId,
            });

            setUploadCompleted((prev) => ({
              ...prev,
              [index]: true,
            }));

            console.log(`File ${file.name} uploaded successfully.`);
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            throw error;
          }
        });
      });

      await Promise.all([...selectionPromises, ...uploadPromises]);

      const completeStep = await axiosInstance.put(
        `/api/treatmentjourneys/step/complete/${stepId}`
      );
      console.log(completeStep);
      setUploadProgress({});
      setUploadCompleted({});
      setSelectedFileName([]);
      setSelectedImageName([]);
      setStepData(null);
      fetchJourneyData();
      fetchStepData(stepData?.next_treatment_plan_stage_item_id);
      console.log(stepData);
      setStageName(stepData?.stage_name);
      setStepName(stepData?.stage_item_name);
    } catch (error) {
      console.error('One or more files failed to upload:', error);
    } finally {
      setButtonIsLoading(false);
    }
  };

  const handleLibraryModalChange = async () => {
    const response = await axiosInstance.get(
      `/api/filesaction/image-repository/${patientId}`
    );
    setLibraryData(response.data);
  };

  useEffect(() => {
    if (libraryModalIsOpen) {
      handleLibraryModalChange();
    }
  }, [libraryModalIsOpen]);

  const handleLibraryClick = (index: number, id: number) => {
    setActionIndex(index);
    setActionId(id);
    setLibraryModalIsOpen(true);
  };

  const handleImageSelection = (imageId: number, imageName: string) => {
    setSelectedImageName((prev) => ({
      ...prev,
      [actionIndex]: {
        imageId,
        actionId,
        imageName,
        type: 'repository',
      },
    }));
    setLibraryModalIsOpen(false);
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await axiosInstance.get(
        `/api/filesaction/download?step_id=${stepId}&action_id=${id}&patient_id=${patientId}`
      );
      const { presignedUrl } = response.data;

      if (presignedUrl) {
        const link = document.createElement('a');
        link.href = presignedUrl;
        const fileName = presignedUrl.split('/').pop() || 'downloaded-file';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to download the file:', error);
    }
  };

  const isUploadButtonRequired = () => {
    let isUploadButtonRequired = false;
    stepData?.treatment_plan_procedure?.forEach((action) => {
      if (action.isUploadRequired) isUploadButtonRequired = true;
    });
    stepData?.treatment_plan_procedure?.forEach((action) => {
      if (action?.isApproveRequired || action?.isMentorReviewRequired)
        isUploadButtonRequired = false;
    });

    return isUploadButtonRequired;
  };

  const isSkipButtonRequired = () => {
    let isSkipButtonRequired = false;
    stepData?.treatment_plan_procedure?.forEach((action) => {
      if (action.isSkippable) isSkipButtonRequired = true;
    });
    stepData?.treatment_plan_procedure?.forEach((action) => {
      if (action?.isApproveRequired || action?.isMentorReviewRequired)
        isSkipButtonRequired = false;
    });

    return isSkipButtonRequired;
  };

  const handleApprove = async (id: number, isUploadRequired: boolean) => {
    try {
      setButtonIsLoading(true);
      if (isUploadRequired) {
        const selectionPromises = [];
        setUploadCompleted({});

        Object.values(selectedImageName).forEach((image) => {
          const selectionPromise = (async () => {
            try {
              const response = await axiosInstance.post(
                `/api/filesaction/image-repository/${image.actionId}`,
                {
                  image_repository_id: image.imageId,
                  patient_id: patientId,
                  treatment_plan_stage_item_id: stepId,
                }
              );
              console.log(response.data.message);
            } catch (error) {
              console.log(error);
              throw error;
            }
          })();
          selectionPromises.push(selectionPromise);
        });

        const uploadPromises = [];
        for (const [index, input] of fileInputs.current.entries()) {
          if (input && input.files) {
            const actionId = input.getAttribute('data-action-id');

            for (const file of Array.from(input.files)) {
              const bodyForPresignedUrl = {
                filename: file.name,
                fileType: file.type || 'application/octet-stream',
                patient_id: patientId,
                journey_id: journeyId,
                workflow_id: journeyData.workflow_id,
                stage_id: stageId,
                step_id: stepId,
                action_id: actionId,
              };

              const uploadPromise = (async () => {
                try {
                  const getPresignedUrl = await axiosInstance.post(
                    '/api/filesaction/generate-presigned-url/',
                    bodyForPresignedUrl
                  );

                  const { fullFilename, presignedUrl } = getPresignedUrl.data;

                  await axios.put(presignedUrl, file, {
                    headers: {
                      'Content-Type': file.type || 'application/octet-stream',
                    },
                    onUploadProgress: (progressEvent) => {
                      const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                      );
                      setUploadProgress((prev) => ({
                        ...prev,
                        [index]: percentCompleted,
                      }));
                    },
                  });

                  await axiosInstance.post('/api/filesaction/upload-success', {
                    filename: fullFilename,
                    patient_id: patientId,
                    step_id: stepId,
                    action_id: actionId,
                  });

                  setUploadCompleted((prev) => ({
                    ...prev,
                    [index]: true,
                  }));

                  console.log(`File ${file.name} uploaded successfully.`);
                } catch (error) {
                  console.error(`Error uploading ${file.name}:`, error);
                  throw error;
                }
              })();

              uploadPromises.push(uploadPromise);
            }
          }
        }

        await Promise.all(selectionPromises);
        await Promise.all(uploadPromises);
      }

      const actionApprovalResponse = await axiosInstance.put(
        `/api/treatmentjourneys/step/action/complete/${id}`
      );
      console.log(actionApprovalResponse.data);

      const stepCompletionResponse = await axiosInstance.put(
        `/api/treatmentjourneys/step/complete/${stepId}`
      );
      console.log(stepCompletionResponse.data);

      setUploadProgress({});
      setUploadCompleted({});
      setSelectedFileName([]);
      setSelectedImageName([]);
      setStepData(null);
      fetchStepData(stepData?.next_treatment_plan_stage_item_id);
      fetchJourneyData();
      console.log(stepData);
      setStageName(stepData?.stage_name);
      setStepName(stepData?.stage_item_name);
    } catch (error) {
      console.error('Error occurred:', error);
    } finally {
      setButtonIsLoading(false);
    }
  };

  const handleCompleteCase = async () => {
    setButtonIsLoading(true);
    try {
      setIsCompleteButtonDisabled(true);
      const response = await axiosInstance.put(
        `/api/treatmentjourneys/complete-journey/${patientId}/${journeyData.treatment_journey_id}`
      );
      console.log(response);
      navigate(`/patients`);
    } catch (error) {
      console.error('Error completing case:', error);
    }
    setButtonIsLoading(false);
  };

  const handleSendToLab = async (
    patient_id: number,
    stepId: number,
    stageId: number
  ) => {
    setButtonIsLoading(true);
    try {
      const response = await axiosInstance.post(
        `/api/servicerequests/${journeyData?.treatment_journey_id}`,
        {
          patient_id: patient_id,
          treatment_plan_stage_item_id: stepId,
          treatment_plan_stage_id: stageId,
          notes: orderNote,
        }
      );
      // setIsButtonDisabled(true);
      await handleLabStatus(stepId);
    } catch (error) {
      console.error('Error completing case:', error);
    }
    setButtonIsLoading(false);
  };

  // const handleLabStatus = async (stepId: number) => {
  //   console.log(stepId);
  //   try {
  //     const response = await axiosInstance.get(
  //       `/api/treatmentjourneys/step/${patientId}?step_id=${stepId}&journey_id=${journeyData?.treatment_journey_id}`
  //     );
  //     const [action] = response.data.treatment_plan_procedure;
  //     setLabStatus(response.data);
  //     setAction(action);
  //     if(action.isSendToLab){
  //       for(let i  in labStatuses){
  //         labStatuses[i].status = 'COMPLETED';
  //         if (
  //           !action.labStatus ||
  //           labStatuses[i].handle == action.labStatus.toLowerCase()
  //         )
  //           break;
  //       }
  //     }
  //     console.log(labStatuses);
  //   } catch (error) {
  //     console.error('Couldnt get Lab Status', error);
  //   }
  // };

  const resetLabStatus = () => {
    for (let i in labStatuses) {
      labStatuses[i].status = 'NOT_STARTED';
    }
  };

  const handleLabStatus = async (stepId: number) => {
    console.log(stepId);
    resetLabStatus();
    try {
      const response = await axiosInstance.get(
        `/api/treatmentjourneys/step/${patientId}?step_id=${stepId}&journey_id=${journeyData?.treatment_journey_id}`
      );
      const [action] = response.data.treatment_plan_procedure;
      setLabStatus(response.data);
      setAction(action);

      if (action.isSendToLab) {
        for (let i in labStatuses) {
          labStatuses[i].status = 'COMPLETED';
          if (
            !action.labStatus ||
            labStatuses[i].handle === action.labStatus.toLowerCase()
          ) {
            break;
          }
        }

        if (action.labStatus.toLowerCase() == 'shipped') {
          try {
            const completeStep = await axiosInstance.put(
              `/api/treatmentjourneys/step/complete/${stepId}`
            );
            console.log('Step completed:', completeStep);
          } catch (error) {
            console.error('Error completing step:', error);
          }
        }
      }
    } catch (error) {
      console.error('Could not get Lab Status', error);
    }
  };

  const placeOrder = async (id: number) => {
    setButtonIsLoading(true);
    try {
      const completeAction = await axiosInstance.put(
        `/api/treatmentjourneys/step/action/complete/${id}`
      );
      console.log(completeAction);
      const completeStep = await axiosInstance.put(
        `/api/treatmentjourneys/step/complete/${stepId}`
      );
      console.log(completeStep);
      setUploadProgress({});
      setUploadCompleted({});
      setSelectedFileName([]);
      setSelectedImageName([]);
      setStepData(null);
      fetchJourneyData();
      fetchStepData(stepData?.next_treatment_plan_stage_item_id);
      console.log(stepData);
      setStageName(stepData?.stage_name);
      setStepName(stepData?.stage_item_name);
    } catch (error) {
      console.log('Something went wrong: ' + error);
    } finally {
      setButtonIsLoading(false);
    }
  };

  return (
    <BaseLayout>
      <Helmet title="Journey" />
      {pageIsLoading && <div>Loading...</div>}
      {!pageIsLoading && !journeyData && <div>No data available..</div>}
      {!pageIsLoading && journeyData && (
        <>
          <div className="flex justify-between gap-4 pb-4 overflow-x-hidden border-b lg:items-center max-lg:flex-col">
            <h1 className="flex-1 text-3xl font-bold md:text-5xl">
              {pageToShow === 'PLAN' &&
                (journeyData?.workflow_name || 'Journey name')}
              {pageToShow === 'STEP' && (stageName || 'Stage name')}
            </h1>
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg lg:px-4 bg-neutral-300 text-neutral-700 ">
                <strong>{patientData?.name}</strong>
                <div className="flex gap-1">
                  <span className="capitalize">{patientData?.gender}</span>
                  <span>|</span>
                  <span>{calculateAge(patientData?.date_of_birth)} years</span>
                </div>
              </div>
              <Sheet>
                <SheetTrigger>
                  <Button size="icon" variant="ghost">
                    <InfoIcon />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>More info</SheetTitle>
                  </SheetHeader>
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full mt-8 text-left"
                  >
                    {faqs.map((faq, index) => (
                      <AccordionItem value={index.toString()} key={index}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </SheetContent>
              </Sheet>
              <Button
                onClick={handleBackButton}
                className="flex items-center w-fit"
              >
                <ChevronLeftIcon className="size-5 relative bottom-0.5" />
                Back
              </Button>
            </div>
          </div>
          <div className="mt-8 timeline">
            <Timeline direction="horizontal" items={mainTimelineItems} />
          </div>
          {pageToShow === 'PLAN' && (
            <div>
              <div className="grid gap-4 mt-8 md:grid-cols-2 lg:grid-cols-4 ">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.subheading}
                    className="p-4 rounded-md bg-slate-100"
                  >
                    <p className="text-2xl font-bold md:text-3xl">
                      {kpi.heading}
                    </p>
                    <p>{kpi.subheading}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start justify-between gap-8 mt-8">
                <div>
                  <h3 className="text-2xl font-bold md:text-3xl">
                    Description
                  </h3>
                  <p className="max-w-2xl mt-2">
                    {journeyData?.description ||
                      'Description has to be returned from backend'}
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      disabled={
                        journeyData.all_stages_completed == false ||
                        isCompleteButtonDisabled ||
                        journeyData.status === 'COMPLETED'
                      }
                    >
                      Complete Treatment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Complete Treatment</DialogTitle>
                      <DialogDescription>
                        Click complete if you are sure you want to mark this
                        treatment as Complete.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={buttonIsLoading}
                        onClick={handleCompleteCase}
                      >
                        {buttonIsLoading && (
                          <LoaderIcon
                            className="duration-300 animate-spin"
                            height={18}
                          />
                        )}
                        Complete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="w-full mt-8">
                <h3 className="text-2xl font-bold md:text-3xl">
                  Treatment Plan
                </h3>
                <div className="grid gap-4 pb-4 mt-8 overflow-x-auto [grid-auto-flow:column] [grid-auto-columns:85%]  sm:[grid-auto-columns:55%]  md:[grid-auto-columns:35%] lg:[grid-auto-columns:23%]">
                  {journeyData?.stages.map((stage) => (
                    <div
                      key={stage.name}
                      className="p-4 rounded-lg bg-slate-100 h-fit"
                    >
                      <div className="flex items-start justify-between gap-2 max-lg:flex-col">
                        <h4 className="text-xl font-bold">{stage.name}</h4>
                        {stage?.skippable && (
                          <Button className="p-1 h-fit">Skip</Button>
                        )}
                      </div>
                      <div className="grid gap-2 mt-4">
                        {stage.steps.map((step, index) => (
                          <div
                            key={index}
                            className={cn([
                              'flex justify-between gap-2 p-2 rounded-lg bg-slate-200 text-slate-700',
                              {
                                'text-slate-500': step.status === 'NOT_STARTED',
                              },
                              {
                                'bg-red-200 text-slate-900':
                                  step.status === 'IN_PROGRESS',
                              },
                              {
                                'bg-green-200 text-slate-900':
                                  step.status === 'COMPLETED',
                              },
                            ])}
                          >
                            <span>{step.name}</span>
                            <div className="flex flex-col items-center justify-start gap-2">
                              <Button
                                variant="ghost"
                                className={cn(
                                  'p-1 transition-colors duration-300 aspect-square bg-white/80 h-fit w-fit hover:bg-white',
                                  {
                                    'pointer-events-nonee opacity-50':
                                      step.status === 'COMPLETED' ||
                                      step.status === 'NOT_STARTED',
                                  }
                                )}
                                onClick={() => cogClicked(stage, step)}
                              >
                                <CogIcon height={15} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {pageToShow === 'STEP' && (
            <>
              {stepName && (
                <h3 className="mt-12 text-2xl font-bold md:text-3xl">
                  {stepName}
                </h3>
              )}
              <div className="grid mt-8 ">
                <div className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {stepData &&
                    stepData?.treatment_plan_procedure.length !== 0 &&
                    stepData?.treatment_plan_procedure.map((item, index) => (
                      <>
                        {!!item?.isUploadRequired &&
                          !item?.isMentorReviewRequired &&
                          !item?.isNotIntegrated && (
                            <div className="flex flex-col w-full max-w-md">
                              <Label
                                htmlFor={`file-input-${index}`}
                                className="h-fit"
                              >
                                {item.procedure_action_name}
                              </Label>
                              <div className="p-4 mt-3 transition-colors duration-300 border-2 border-dashed rounded-lg border-slate-300 hover:border-slate-400 group">
                                <div className="grid sm:grid-cols-2 text-slate-500 ">
                                  <div className="relative w-full p-2 cursor-pointer ">
                                    <Input
                                      type="file"
                                      id={`file-input-${index}`}
                                      data-action-id={
                                        item.treatment_plan_action_id
                                      }
                                      ref={(el) =>
                                        (fileInputs.current[index] = el)
                                      }
                                      className="absolute inset-0 h-full opacity-0 cursor-pointer"
                                      onChange={(e) =>
                                        handleFileChange(e, index)
                                      }
                                    />
                                    <div className="flex items-center justify-center w-full h-full pb-2 text-xs text-center transition-colors duration-300 border-dashed max-sm:border-b-2 sm:border-r-2 sm:flex-col group-hover:border-slate-400">
                                      <UploadIcon className="mr-2 sm:mb-2 size-5 sm:size-8 text-slate-400" />
                                      Drag & Drop or{' '}
                                      <br className="max-sm:hidden" />
                                      click to upload
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleLibraryClick(
                                        index,
                                        item?.treatment_plan_action_id
                                      )
                                    }
                                    className="flex items-center justify-center w-full h-full p-2 text-xs text-center sm:flex-col text-slate-500"
                                  >
                                    <LibraryIcon className="mr-2 sm:mb-2 size-5 sm:size-8 text-slate-400" />
                                    Select from image library
                                  </button>
                                </div>
                                {!!selectedFileName[index] && (
                                  <p className="pt-4 text-sm text-center transition-colors duration-300 border-t-2 border-dashed text-slate-500 group-hover:border-slate-400">
                                    <span className="block">
                                      Selected from storage:
                                    </span>
                                    <strong className="max-w-full line-clamp-1 text-ellipsis">
                                      {selectedFileName[index]?.fileName}
                                    </strong>
                                  </p>
                                )}
                                {!!selectedImageName[index] && (
                                  <p className="pt-4 text-sm text-center transition-colors duration-300 border-t-2 border-dashed text-slate-500 group-hover:border-slate-400">
                                    <span className="block">
                                      Selected from image library:
                                    </span>
                                    <strong className="max-w-full line-clamp-1 text-ellipsis">
                                      {selectedImageName[index]?.imageName}
                                    </strong>
                                  </p>
                                )}
                              </div>
                              {(uploadProgress[index] || 0) > 0 && (
                                <Progress
                                  value={uploadProgress[index]}
                                  className={cn('h-2 mt-2', {
                                    hidden: uploadCompleted[index],
                                    block: !uploadCompleted[index],
                                  })}
                                />
                              )}
                              {uploadCompleted[index] && (
                                <p className="text-sm text-green-500">
                                  Upload Complete
                                </p>
                              )}
                            </div>
                          )}
                        {!!item?.isDownloadRequired && (
                          <button
                            onClick={() =>
                              handleDownload(item?.treatment_plan_action_id)
                            }
                            className="flex justify-between w-full p-4 text-xs transition-colors duration-300 border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-slate-400"
                          >
                            <span>{item.procedure_action_name}</span>
                            <DownloadIcon className="mr-2 sm:mb-2 size-5 text-slate-400" />
                          </button>
                        )}

                        {!!item?.isOrderConsumables && (
                          <div className="col-span-4">
                            <div className="grid gap-8 p-2 border rounded-lg sm:p-4 lg:p-6 grid-4 md:grid-cols-2 xl:grid-cols-4">
                              {consumables.map(
                                ({
                                  name,
                                  article,
                                  image,
                                  addedToCart = false,
                                }) => (
                                  <div className="flex flex-col p-2 text-center rounded-md bg-neutral-100 lg:p-4 text-neutral-900 ">
                                    <img
                                      src={image}
                                      alt=""
                                      className="object-contain w-auto h-24"
                                    />
                                    <h5 className="mt-2 text-lg font-bold">
                                      {name}
                                    </h5>
                                    <p className="text-sm text-neutral-700">
                                      Article ID: {article}
                                    </p>

                                    <div className="flex justify-center mt-auto">
                                      {addedToCart ? (
                                        <Button className="flex items-center gap-2 mt-4">
                                          <ShoppingCartIcon className="size-4" />
                                          <span className="text-sm">
                                            Add to Cart
                                          </span>
                                        </Button>
                                      ) : (
                                        <Button className="flex items-center gap-2 mt-2 bg-green-600 hover:bg-green-704">
                                          <CheckIcon className="size-4" />
                                          <span className="text-sm">
                                            Added to Cart
                                          </span>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                            <Button
                              className="flex items-center gap-1 mt-8"
                              onClick={() =>
                                placeOrder(item.treatment_plan_action_id)
                              }
                              disabled={buttonIsLoading}
                            >
                              {buttonIsLoading && (
                                <LoaderIcon
                                  className="duration-300 animate-spin"
                                  height={18}
                                />
                              )}
                              Place Order
                            </Button>
                          </div>
                        )}

                        {!!item?.isSendToLab && (
                          <div>
                            {!action?.labStatus && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button>Send to Lab</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Order Notes</DialogTitle>
                                    <DialogDescription>
                                      Enter the order notes in the text area
                                      below. Click Send when you're done.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-1 py-4">
                                    <div className="">
                                      <Label
                                        htmlFor="note"
                                        className="text-right"
                                      >
                                        Order Notes
                                      </Label>
                                    </div>
                                    <Textarea
                                      maxLength={255}
                                      className="w-full resize-none"
                                      id="note"
                                      placeholder="Type your note here."
                                      value={orderNote} // Bind the value to state
                                      onChange={(e) =>
                                        setOrderNote(e.target.value)
                                      }
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={() => {
                                        handleSendToLab(
                                          journeyData.patient_id,
                                          stepId,
                                          stageId
                                        );
                                      }}
                                      disabled={buttonIsLoading}
                                    >
                                      {buttonIsLoading && (
                                        <LoaderIcon
                                          className="duration-300 animate-spin"
                                          height={18}
                                        />
                                      )}
                                      Send
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}

                            {action?.labStatus && (
                              <div className="w-full p-6 mt-6 rounded bg-slate-200 timeline">
                                <p className="mb-4 text-lg font-semibold">
                                  Design Status
                                </p>
                                <Timeline
                                  direction="vertical"
                                  items={labStatuses}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ))}
                </div>
                <div className="flex items-center gap-4 mt-4 ">
                  {isUploadButtonRequired() && (
                    <Button
                      disabled={buttonIsLoading}
                      onClick={uploadFiles}
                      className="w-fit"
                    >
                      {buttonIsLoading && (
                        <LoaderIcon
                          className="duration-300 animate-spin"
                          height={18}
                        />
                      )}
                      Upload Files
                    </Button>
                  )}
                  {isSkipButtonRequired() && (
                    <Button
                      variant="secondary"
                      disabled={buttonIsLoading}
                      className="w-fit"
                    >
                      Skip
                    </Button>
                  )}
                  {stepData &&
                    stepData?.treatment_plan_procedure.length !== 0 &&
                    stepData?.treatment_plan_procedure.map((item, index) => (
                      <>
                        {(!!item?.isApproveRequired ||
                          !!item?.isMentorReviewRequired) && (
                          <Button
                            key={index}
                            disabled={buttonIsLoading}
                            onClick={() =>
                              handleApprove(
                                item?.treatment_plan_action_id,
                                !!item?.isUploadRequired
                              )
                            }
                            className="w-fit"
                          >
                            {buttonIsLoading && (
                              <LoaderIcon
                                className="duration-300 animate-spin"
                                height={18}
                              />
                            )}
                            {item?.procedure_action_name}
                          </Button>
                        )}
                        {!!item?.isNotIntegrated && (
                          <Button>Upload Surgical Plan</Button>
                        )}
                        {(!!item?.isApproveRequired ||
                          !!item?.isMentorReviewRequired) &&
                          !!item?.isSkippable && (
                            <Button variant="secondary">Skip</Button>
                          )}{' '}
                        {(!!item?.isApproveRequired ||
                          !!item?.isMentorReviewRequired) &&
                          !!item?.isRejectable && (
                            <Button variant="destructive">Reject</Button>
                          )}
                      </>
                    ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
      <AlertDialog
        open={libraryModalIsOpen}
        onOpenChange={handleLibraryModalChange}
      >
        <AlertDialogContent className="max-w-5xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Use Image from Image Library</AlertDialogTitle>
            <AlertDialogDescription>
              Select the image from the library. Click save when you're done.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!!libraryData?.length ? (
            <div className="overflow-y-auto h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Uploaded in Journey</TableHead>
                    <TableHead>Uploaded at Stage</TableHead>
                    <TableHead>Uploaded in Step</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {libraryData.map((image, index) => (
                    <TableRow
                      className="transition-colors duration-300 cursor-pointer hover:bg-neutral-100"
                      onClick={() =>
                        handleImageSelection(
                          image?.image_repository_id,
                          image?.filename
                        )
                      }
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center">No data to display.</div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLibraryModalIsOpen(false)}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BaseLayout>
  );
}
