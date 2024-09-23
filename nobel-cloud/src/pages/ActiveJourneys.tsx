// Journeys.tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BaseLayout from '@/layouts/BaseLayout';
import DataTable from '@/components/data-table';
import axiosInstance from '@/api/axiosInstance';
import Helmet from '@/components/Helmet';

const columns = [
  {
    header: 'Name',
    accessorKey: 'name',
    id: 'name',
  },
  {
    header: 'Description',
    accessorKey: 'description',
    id: 'description',
  },
  {
    header: 'Duration',
    accessorKey: 'duration',
    id: 'duration',
  },
];

export default function ActiveJourneys() {
  const [initialData, setInitialData] = useState([]);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await axiosInstance.get('/api/workflows', {
          params: {
            page: 1,
            limit: 10,
          },
        });
        setInitialData(response.data.data);
        setPagination(response.data.pagination);
      } catch (err) {
        setError('Error fetching initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  return (
    <BaseLayout>
      <Helmet title="Patient Journeys" />
      <div className="flex justify-between gap-4 lg:items-center max-lg:flex-col">
        <h1 className="flex-1 text-3xl font-bold md:text-5xl">
          Patient Journeys
        </h1>
      </div>

      <div className="justify-between hidden mt-8 max-lg:flex-col">
        <div className="flex items-center flex-1 w-full max-w-lg space-x-2">
          <Input type="search" placeholder="Search for a treatment" />
          <Button type="submit">Search</Button>
        </div>
        <Button variant="link">Apply Filters</Button>
      </div>

      <div className="mt-8">
        {initialData.length !== 0 && !loading && !error && (
          <DataTable
            columns={columns}
            objectsId="workflow_id"
            pagination={pagination}
            data={initialData.filter((a) => !!a.duration)}
          />
        )}
        {loading && <div>Loading...</div>}
        {error && <div>Error loading data: {error}</div>}
      </div>
    </BaseLayout>
  );
}
