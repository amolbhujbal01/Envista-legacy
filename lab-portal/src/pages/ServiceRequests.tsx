import Helmet from '@/components/Helmet';
import { useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';
import DataTable from '@/components/data-table';
import BaseLayout from '@/layouts/BaseLayout';
import { Eye, EllipsisVertical, CircleCheckBig, CircleX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { captureRejectionSymbol } from 'events';

export default function ServiceRequests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 5,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const statusLabels = {
    SHIPPED: 'Shipped',
    DESIGN_PHASE: 'Design Phase',
    PENDING: 'Pending',
  };

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `/api/servicerequests/getservicerequests/199/1?page=${page}&limit=${pagination.pageSize}&search=${search}`
      );
      const requests = response.data.data.map((request: any) => ({
        id: request.id,
        service_id: request.service_request_id,
        status: statusLabels[request.status] || request.status,
        date: request.date,
        name: request.patient_name,
        practice_id: request.practice_id,
        practice_name: request.practice_name,
        requestor: request.requestor_name,
        journey_id: request.treatment_journey_id,
      }));
      setData(requests);

      setPagination({
        totalRecords: response.data.pagination.total_items,
        totalPages: response.data.pagination.total_pages,
        currentPage: response.data.pagination.current_page,
        pageSize: response.data.pagination.items_per_page,
      });
    } catch (err) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (page: number) => {
    fetchData(page, searchQuery);
  };

  const handleSearch = (search: string) => {
    setSearchQuery(search);
    fetchData(1, search);
  };

  const handleAccept = async (practiceId: number, requestId: number) => {
    const StatusChangeURL = `/api/servicerequests/updatestatus/${practiceId}/${encodeURIComponent(requestId)}`;
    console.log(practiceId);
    console.log(requestId);
    try {
      await axiosInstance.put(StatusChangeURL, {
        status: 'Design Phase',
      });
      setData((prevData) =>
        prevData.map((item) =>
          item.id === requestId ? { ...item, status: 'Design Phase' } : item
        )
      );
      navigate(
        `/service-requests/${practiceId}/${encodeURIComponent(requestId)}`
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const columns = [
    {
      header: 'Service Request ID',
      accessorKey: 'service_id',
      id: 'service_id',
      cell: ({ row }) => {
        const status = row.original.status.toLowerCase();
        console.log('HEYYYYYYYYYYYYYYYYYYYYYY', row.original);
        return status === 'design phase' ? (
          <Link
            to={`/service-requests/${row.original.practice_id}/${encodeURIComponent(row.original.service_id)}`}
            className="block w-full h-full text-slate-900 font-medium hover:underline"
          >
            {row.original.service_id}
          </Link>
        ) : (
          <span className="text-slate-900">{row.original.service_id}</span>
        );
      },
    },
    { header: 'Patient Name', accessorKey: 'name', id: 'name' },
    { header: 'Status', accessorKey: 'status', id: 'status' },
    { header: 'Date', accessorKey: 'date', id: 'date' },
    { header: 'Requestor', accessorKey: 'requestor', id: 'requestor' },
    {
      header: 'Practice Name',
      accessorKey: 'practice_name',
      id: 'practice_name',
    },
    {
      header: 'Journey ID',
      accessorKey: 'journey_id',
      id: 'journey_id',
      cell: ({ row }) => (
        <span>#{row.original.journey_id}</span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      id: 'actions',
      cell: ({ row }) => {
        const status = row.original.status;
        console.log(status);
        const isDisabled =
          status.toLowerCase() === 'design phase' ||
          status.toLowerCase() === 'shipped';

        const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
          e.preventDefault();
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" onClick={handleClick}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleAccept(
                      row.original.practice_id,
                      row.original.service_id
                    ); // Pass practice_id here
                  }}
                  disabled={isDisabled}
                  className={isDisabled ? 'cursor-not-allowed opacity-50' : ''}
                >
                  <CircleCheckBig className="mr-2 h-4 w-4" />
                  <span>Accept and Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                  <CircleX className="mr-2 h-4 w-4" />
                  <span>Reject</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <BaseLayout>
      <Helmet title="Service Requests" />
      <div className="flex justify-between gap-4 lg:items-center max-lg:flex-col">
        <h1 className="flex-1 text-3xl font-bold md:text-5xl">
          Service Requests
        </h1>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          route="service-requests"
          pagination={pagination}
          onPageChange={handlePageChange}
          objectsId="service_id"
          onSearch={handleSearch}
        />
      )}
    </BaseLayout>
  );
}
