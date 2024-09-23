import { useEffect, useState } from 'react';
import Helmet from '@/components/Helmet';
import { Button } from '@/components/ui/button';
import BaseLayout from '@/layouts/BaseLayout';
import { CogIcon, StickyNoteIcon } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useParams } from 'react-router-dom';

interface WorkflowResponse {
  status: string;
  name: string;
  description: string;
  conditionsTreated: string;
  duration: number;
  noOfStages: number;
  stages: {
    name: string;
    steps: {
      name: string;
    }[];
    skippable: boolean;
  }[];
}

export default function ActiveJourney() {
  const [workflowData, setWorkflowData] = useState<WorkflowResponse>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        const response = await axiosInstance.get(`/api/workflows/${id}`);
        setWorkflowData(response.data);
      } catch (error) {
        console.error('Error fetching workflow data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflowData();
  }, []);

  const kpis = [
    { heading: `${workflowData?.noOfStages}`, subheading: 'Stages' },
    {
      heading: `${workflowData?.duration}mo`,
      subheading: 'Estimated duration',
    },
    { heading: `$3000`, subheading: 'Estimated cost' },
    { heading: '86%', subheading: 'Completion rate' },
  ];

  return (
    <BaseLayout>
      <Helmet title={workflowData?.name?.toString()} />
      {isLoading && <div>Loading...</div>}
      {!isLoading && !workflowData && <div>No data available..</div>}
      {!isLoading && workflowData && (
        <>
          <div className="flex justify-between gap-4 pb-4 overflow-x-hidden border-b lg:items-center max-lg:flex-col">
            <h1 className="flex-1 text-3xl font-bold md:text-5xl">
              {workflowData?.name}
            </h1>
          </div>
          <div className="grid gap-4 mt-8 sm:grid-cols-2 lg:grid-cols-4 ">
            {kpis.map((kpi) => (
              <div key={kpi.subheading} className="p-4 rounded-md bg-slate-100">
                <p className="text-2xl font-bold md:text-3xl">{kpi.heading}</p>
                <p>{kpi.subheading}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <h3 className="text-2xl font-bold md:text-3xl">Description</h3>
            <p className="max-w-2xl mt-2">{workflowData?.description}</p>
          </div>
          <div className="w-full mt-8">
            <h3 className="text-2xl font-bold md:text-3xl">Treatment Plan</h3>
            <div className="grid gap-4 pb-4 mt-8 overflow-x-auto [grid-auto-flow:column] [grid-auto-columns:85%]  sm:[grid-auto-columns:55%]  md:[grid-auto-columns:35%] lg:[grid-auto-columns:23%]">
              {workflowData?.stages.map((stage) => (
                <div
                  key={stage.name}
                  className="p-4 rounded-lg bg-slate-100 h-fit"
                >
                  <div className="flex items-start justify-between gap-2 max-lg:flex-col">
                    <h4 className="text-xl font-bold">{stage.name}</h4>
                    {stage.skippable && (
                      <Button className="p-1 uppercase h-fit">Skip</Button>
                    )}
                  </div>
                  <div className="grid gap-2 mt-4">
                    {stage.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex justify-between p-2 rounded-lg bg-slate-200 text-slate-700"
                      >
                        <span>{step.name}</span>
                        <div className="flex flex-col items-center justify-start gap-2">
                          <Button
                            variant="ghost"
                            className="p-1 transition-colors duration-300 aspect-square bg-white/60 h-fit w-fit hover:bg-white"
                          >
                            <CogIcon height={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            className="p-1 transition-colors duration-300 aspect-square bg-white/60 h-fit w-fit hover:bg-white"
                          >
                            <StickyNoteIcon height={15} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </BaseLayout>
  );
}
