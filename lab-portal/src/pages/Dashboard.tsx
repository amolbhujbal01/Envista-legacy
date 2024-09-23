import Helmet from '@/components/Helmet';
import { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import axiosInstance from '@/api/axiosInstance';
import DataTable from '@/components/data-table';
import {
  Boxes,
  FileCheck2,
  Hourglass,
  Brush,
  Timer,
  Truck,
} from 'lucide-react';

export default function Dashboard() {
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
  const [kpisData, setKpisData] = useState([]);

  const statusLabels = {
    SHIPPED: 'Shipped',
    DESIGN_PHASE: 'Design Phase',
    PENDING: 'Pending',
  };

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      // Fetch service requests data
      const response = await axiosInstance.get(
        `/api/servicerequests/getservicerequests/199/1?page=${page}&limit=${pagination.pageSize}&search=${search}`
      );
      const requests = response.data.data.map((request: any) => ({
        service_id: request.service_request_id,
        status: statusLabels[request.status] || request.status,
        date: request.date,
        name: request.patient_name,
      }));
      setData(requests);
      setPagination({
        totalRecords: response.data.pagination.total_items,
        totalPages: response.data.pagination.total_pages,
        currentPage: response.data.pagination.current_page,
        pageSize: response.data.pagination.items_per_page,
      });

      const kpisResponse = await axiosInstance.get(
        `/api/servicerequests/getservicerequestscount/199/1`
      );
      const kpis = kpisResponse.data[0];
      const kpisDataFormatted = [
        {
          icon: <Boxes strokeWidth="1.5px" width="20px" />,
          value: kpis.total_service_requests.count,
          text: kpis.total_service_requests.status,
        },
        {
          icon: <Hourglass strokeWidth="1.5px" width="20px" />,
          value: kpis.pending_requests.count,
          text: kpis.pending_requests.status,
        },
        {
          icon: <Brush strokeWidth="1.5px" width="20px" />,
          value: kpis.design_phase_requests.count,
          text: kpis.design_phase_requests.status,
        },
        {
          
          icon: <Truck strokeWidth="1.5px" width="20px" />,
          value: kpis.shipped_requests.count,
          text: kpis.shipped_requests.status,
        },
        {
          icon: <Timer strokeWidth="1.5px" width="20px" />,
          value: kpis.on_hold_requests.count,
          text: kpis.on_hold_requests.status,
        },
      ];
      setKpisData(kpisDataFormatted);
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

  const columns = [
    {
      header: 'Service Request ID',
      accessorKey: 'service_id',
      id: 'service_id',
    },
    { header: 'Patient Name', accessorKey: 'name', id: 'name' },
    { header: 'Status', accessorKey: 'status', id: 'status' },
    { header: 'Date', accessorKey: 'date', id: 'date' },
  ];

  return (
    <BaseLayout>
      <Helmet title="Service Requests" />
      <div className="flex justify-between gap-4 lg:items-center max-lg:flex-col">
        <h1 className="flex-1 text-3xl font-bold md:text-5xl">Dashboard</h1>
      </div>
      <div className="flex flex-col gap-2 justify-between mt-8 sm:grid sm:grid-cols-2 lg:grid-cols-5">
        {kpisData.map((kpi, index) => (
          <div
            key={index}
            className="kpi bg-slate-100 rounded p-3 w-full flex gap-2 items-start hover:bg-slate-200 ease-in-out duration-300 hover:scale-105"
          >
            <span>{kpi.icon}</span>
            <div>
              <p className="text-slate-800 font-bold text-2xl mb-1">
                {kpi.value}
              </p>
              <p className="text-slate-700 text-xs">{kpi.text}</p>
            </div>
          </div>
        ))}
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
