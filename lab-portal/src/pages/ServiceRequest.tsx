import Helmet from '@/components/Helmet';
import { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import axiosInstance from '@/api/axiosInstance';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Stethoscope,
  MessageCircle,
  Eye,
  Settings2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const pageKpis = [
  {
    id: '1',
    text: 'Tooth Shade',
    value: 'BL',
  },
  {
    id: '2',
    text: 'Gum Tissue',
    value: 'Pale Pink',
  },
];

const scanImgs = [
  {
    id: '1',
    img: 'https://eastportdentalaz.com/wp-content/uploads/2022/02/dental-x-ray-mesa-az.jpeg',
    title: 'patient_xray',
  },
  {
    id: '2',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTF2eulspJYJ68mPGmfzYE-C_U4Mi5HVV3Klg&s',
    title: 'patient_cbct',
  },
];

export default function ServiceRequest() {
  const { practiceId, requestId } = useParams();
  const [isShipped, setIsShipped] = useState(false);
  const [data, setData] = useState(null); // Use null initially
  const [error, setError] = useState(null);
  const [scanImgs, setScanImgs] = useState([]);
  const navigate = useNavigate();

  const fetchData = async (practiceID: number, service_id: string) => {
    setError(null);
    console.log(service_id);
    console.log(practiceID);
    try {
      const response = await axiosInstance.get(
        `/api/servicerequests/getservicerequest/${practiceID}/1/${encodeURIComponent(service_id)}`
      );
      console.log(response);
      const requestData = response.data;
      console.log(requestData);
      setData(requestData);

      const files = requestData.files.map((file) => ({
        id: file.image_repository_id,
        title: file.filename,
        downloadUrl: file.presigned_s3url,
      }));
      setScanImgs(files);
    } catch (err) {
      setError(err.message || 'Error fetching data');
    }
  };

  useEffect(() => {
    fetchData(practiceId, requestId);
  }, [practiceId, requestId]);

  const handleShip = async (practiceID: number, requestId: number) => {
    const StatusChangeURL = `/api/servicerequests/updatestatus/${practiceID}/${encodeURIComponent(requestId)}`;
    try {
      await axiosInstance.put(StatusChangeURL, {
        status: 'Shipped',
      });
      setData((prevData) =>
        prevData.map((item) =>
          item.id === requestId ? { ...item, status: 'Shipped' } : item
        )
      );
      navigate(`/service-requests`);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // const handleDownload = (url: string) => {
  //   window.open(url, '_blank');
  // };

  const handleDownload = (presignedUrl: string) => {
    console.log('Presigned URL: ', presignedUrl);
    const link = document.createElement('a');
    link.href = presignedUrl;
    const fileName = presignedUrl.split('/').pop() || 'downloaded-file';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusLabels = {
    SHIPPED: 'Shipped',
    DESIGN_PHASE: 'Design Phase',
    PENDING: 'Pending',
  };

  return (
    <BaseLayout>
      <Helmet title="Service Requests" />
      <div className="flex-col flex md:flex-row md:gap-10 md:items-center md:flex-nowrap">
        <div className="flex flex-wrap gap-3 items-center sm:flex-nowrap">
          <h1 className="text-3xl font-black md:text-5xl whitespace-nowrap">
            Service Requests
          </h1>
          <h1 className="text-3xl font-black md:text-5xl w-auto">
            {data ? data.service_request_id : 'Loading...'}
          </h1>
        </div>
        <div className="bg-slate-300 pt-1 mt-2 pb-1 pl-4 pr-4 text-center text-sm text-slate-800 rounded font-medium max-w-80 lg:mt-0">
          <p>{data ? statusLabels[data.status] || 'Loading' : 'Loading'}</p>
        </div>
      </div>
      <div className="bg-slate-400 h-0.5 w-full mt-7 mb-7"></div>
      <div className="flex-col justify-between align-bottom lg:flex-row flex">
        <div className="flex gap-4 items-center">
          {pageKpis.map((kpi, index) => (
            <div
              key={index}
              className="kpi bg-slate-100 rounded p-3 flex gap-2 items-start hover:bg-slate-200 ease-in-out duration-300 hover:scale-105 w-[250px]"
            >
              <div>
                <p className="text-slate-700 text-xs">{kpi.text}</p>
                <p className="text-slate-800 font-bold text-2xl mb-1">
                  {kpi.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 items-center mt-2 lg:mt-0">
          <Button>Import</Button>
          <Button>Export</Button>
        </div>
      </div>
      <div className="bg-slate-100 rounded p-5 flex flex-col justify-between items-start mt-8 sm:flex-row sm:items-center">
        <div className="flex gap-4 items-center">
          <Stethoscope size="60" className="text-slate-400" />
          <p className="text-2xl text-slate-800 font-bold">Talk to a doctor!</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="flex gap-2 items-center">
            <MessageCircle size="15" />
            Start Chat
          </Button>
        </div>
      </div>
      {/* <div className="mt-8 flex flex-col items-start gap-4 justify-center md:flex-row images">
        {scanImgs.map((card, index) => (
          <div
            key={index}
            className="p-3 border border-slate-400 rounded w-full min-w-[280px] md:w-[280px]"
          >
            <div className="h-[200px] w-full">
              <img
                src={card.img}
                alt="patient scan"
                className="w-full h-full object-cover rounded"
              />
            </div>
            <div className="flex justify-between items-center mt-2 p-2">
              <p className="text-sm text-slate-700 font-medium">{card.title}</p>
              <Eye size="20" />
            </div>
          </div>
        ))}
      </div> */}
      <div className="mt-8 font-semibold">
        <p className="text-lg mb-3">Patient Files</p>
        <div className=" flex flex-col items-start gap-4 md:flex-row images flex-wrap">
          {scanImgs.map((card, index) => (
            <div
              key={index}
              className="p-3 border border-slate-400 rounded flex justify-between items-center w-full min-w-[200px] md:w-[200px]"
            >
              <div className=" w-full flex gap-4 items-center justify-between">
                <p className="text-sm text-slate-700 font-medium break-all text-ellipsis max-w-[200px] truncate">
                  {card.title}
                </p>
                <Download
                  onClick={() => handleDownload(card.downloadUrl)}
                  className="cursor-pointer text-[10px] w-[50px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 font-semibold">
        
        <div className='border border-slate-400 p-3 rounded'>
        <p className="text-lg mb-2">Order Notes</p>
          <p className='text-sm font-normal text-slate-500'>{data ? data.notes : 'No Notes yet...'}</p>
        </div>
      </div>

      <div className="bg-slate-200 flex-col rounded p-5 flex justify-between items-start mt-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-slate-800 font-semibold text-lg">Actions</p>
          <div className="flex gap-3 items-center mt-2">
            <Button>Put On Hold</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Ship Case</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Ship Case</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to ship this case? Clicking on 'Ship Case'
                    will mark this case as Shipped.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleShip(practiceId, data.service_request_id);
                    }}
                  >
                    Ship Case
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <Settings2 size="70" className="text-slate-400" />
        </div>
      </div>
    </BaseLayout>
  );
}
