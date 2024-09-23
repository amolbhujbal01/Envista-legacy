import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BaseLayout from '@/layouts/BaseLayout';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import DataTable from '@/components/data-table';
import axiosInstance from '@/api/axiosInstance';
import { useEffect, useState } from 'react';
import Helmet from '@/components/Helmet';

const columns = [
  {
    header: 'Name',
    accessorKey: 'name',
    id: 'name',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    id: 'age',
  },
  {
    header: 'Email address',
    accessorKey: 'email',
    id: 'email',
  },
  {
    header: 'Phone number',
    accessorKey: 'phone',
    id: 'phone',
  },
];

export default function Patients() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `/api/patient?limit=${pagination.pageSize}&page=${page}&name=${search}`
      );
      const patients = response.data.data.map((patient: any) => ({
        id: patient.patient_id,
        name: patient.name,
        age:
          new Date().getFullYear() -
          new Date(patient.date_of_birth).getFullYear(),
        email: patient.email,
        phone: patient.phone,
      }));
      setData(patients);
      setPagination({
        totalRecords: response.data.pagination.totalRecords,
        totalPages: response.data.pagination.totalPages,
        currentPage: response.data.pagination.currentPage,
        pageSize: response.data.pagination.pageSize,
      });
    } catch (err) {
      setError(err);
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

  return (
    <BaseLayout>
      <Helmet title="Patients" />
      <div className="flex justify-between gap-4 lg:items-center max-lg:flex-col">
        <h1 className="flex-1 text-3xl font-bold md:text-5xl">Patients</h1>
        <div className="flex items-center gap-4">
          <Link
            to="/patients/add"
            className={twMerge(
              buttonVariants({ size: 'sm' }),
              'flex items-center justify-center'
            )}
          >
            Add Patient
          </Link>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data}
        route="patients"
        pagination={pagination}
        onPageChange={handlePageChange}
        objectsId="id"
        onSearch={handleSearch}
      />
    </BaseLayout>
  );
}
