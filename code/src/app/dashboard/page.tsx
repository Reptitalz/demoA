
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardPageContent from '@/components/dashboard/DashboardPageContent';

const DashboardPage = () => {
  return (
    <Suspense fallback={
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={36} />
      </PageContainer>
    }>
      <DashboardPageContent />
    </Suspense>
  );
};

export default DashboardPage;
